export interface Press3Record {
  admins: string[];
  pages: {
    type: string;
    fields: PageRecord;
  }[];
}

export interface PageRecord {
  path: string;
  walrus_id: string;
  editors: string[];
}
