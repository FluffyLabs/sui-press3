import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";

const MODULE_NAME = "press3";

let suiClient: SuiClient | null = null;

export function getSuiClient(): SuiClient {
  if (!suiClient) {
    suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });
  }
  return suiClient;
}

export interface PageRecord {
  path: string;
  walrus_id: string;
  editors: string[];
}

export interface Press3State {
  objectId: string;
  admins: string[];
  pages: PageRecord[];
}

/**
 * Finds the shared Press3 object by querying for objects of the Press3 type.
 */
export async function findPress3Object(
  packageId: string,
): Promise<string | null> {
  const client = getSuiClient();

  // Query for objects owned by the package (shared objects)
  // We need to find the Press3 object that was created during init
  const objects = await client.queryEvents({
    query: {
      MoveEventType: `${packageId}::${MODULE_NAME}::Press3InitializedEvent`,
    },
    limit: 1,
  });

  if (objects.data.length > 0) {
    // Get the transaction that emitted this event to find the created object
    const txDigest = objects.data[0].id.txDigest;
    const tx = await client.getTransactionBlock({
      digest: txDigest,
      options: { showEffects: true },
    });

    // Find the created shared object
    const created = tx.effects?.created;
    if (created) {
      for (const obj of created) {
        if (
          obj.owner &&
          typeof obj.owner === "object" &&
          "Shared" in obj.owner
        ) {
          return obj.reference.objectId;
        }
      }
    }
  }

  return null;
}

/**
 * Fetches the Press3 state from the blockchain.
 */
export async function getPress3State(
  objectId: string,
): Promise<Press3State | null> {
  const client = getSuiClient();

  try {
    const object = await client.getObject({
      id: objectId,
      options: { showContent: true },
    });

    if (object.data?.content?.dataType === "moveObject") {
      const fields = object.data.content.fields as {
        admins: string[];
        pages: Array<{
          fields: {
            path: string;
            walrus_id: string;
            editors: string[];
          };
        }>;
      };

      return {
        objectId,
        admins: fields.admins,
        pages: fields.pages.map((p) => ({
          path: p.fields.path,
          walrus_id: p.fields.walrus_id,
          editors: p.fields.editors,
        })),
      };
    }
  } catch (error) {
    console.error("Error fetching Press3 state:", error);
  }

  return null;
}

/**
 * Subscribes to Press3 events (PageRegistered, PageUpdated).
 */
export async function subscribeToPress3Events(
  packageId: string,
  onPageRegistered: (event: {
    path: string;
    walrus_id: string;
    editors: string[];
  }) => void,
  onPageUpdated: (event: {
    path: string;
    old_walrus_id: string;
    new_walrus_id: string;
  }) => void,
): Promise<() => void> {
  const client = getSuiClient();

  const unsubscribeRegistered = await client.subscribeEvent({
    filter: {
      MoveEventType: `${packageId}::${MODULE_NAME}::PageRegisteredEvent`,
    },
    onMessage: (event) => {
      const parsed = event.parsedJson as {
        path: string;
        walrus_id: string;
        editors: string[];
      };
      onPageRegistered(parsed);
    },
  });

  const unsubscribeUpdated = await client.subscribeEvent({
    filter: {
      MoveEventType: `${packageId}::${MODULE_NAME}::PageUpdatedEvent`,
    },
    onMessage: (event) => {
      const parsed = event.parsedJson as {
        path: string;
        old_walrus_id: string;
        new_walrus_id: string;
      };
      onPageUpdated(parsed);
    },
  });

  return () => {
    unsubscribeRegistered();
    unsubscribeUpdated();
  };
}

/**
 * Queries historical page events from the blockchain.
 */
export async function queryPageEvents(packageId: string): Promise<
  Array<{
    type: "registered" | "updated";
    path: string;
    walrus_id?: string;
    old_walrus_id?: string;
    new_walrus_id?: string;
    editors?: string[];
    timestamp?: string;
  }>
> {
  const client = getSuiClient();
  const events: Array<{
    type: "registered" | "updated";
    path: string;
    walrus_id?: string;
    old_walrus_id?: string;
    new_walrus_id?: string;
    editors?: string[];
    timestamp?: string;
  }> = [];

  // Query PageRegisteredEvents
  const registeredEvents = await client.queryEvents({
    query: {
      MoveEventType: `${packageId}::${MODULE_NAME}::PageRegisteredEvent`,
    },
    limit: 50,
  });

  for (const event of registeredEvents.data) {
    const parsed = event.parsedJson as {
      path: string;
      walrus_id: string;
      editors: string[];
    };
    events.push({
      type: "registered",
      path: parsed.path,
      walrus_id: parsed.walrus_id,
      editors: parsed.editors,
      timestamp: event.timestampMs ?? undefined,
    });
  }

  // Query PageUpdatedEvents
  const updatedEvents = await client.queryEvents({
    query: {
      MoveEventType: `${packageId}::${MODULE_NAME}::PageUpdatedEvent`,
    },
    limit: 50,
  });

  for (const event of updatedEvents.data) {
    const parsed = event.parsedJson as {
      path: string;
      old_walrus_id: string;
      new_walrus_id: string;
    };
    events.push({
      type: "updated",
      path: parsed.path,
      old_walrus_id: parsed.old_walrus_id,
      new_walrus_id: parsed.new_walrus_id,
      timestamp: event.timestampMs ?? undefined,
    });
  }

  return events;
}

export { MODULE_NAME };
