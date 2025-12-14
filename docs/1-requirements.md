# Requirements

## System packages

- **Bun** 1.1+ (installs its own Node.js runtime) – drives the CLI and frontend builds.
- **npm** 9+ – handy for installing extra JS tooling, even though Bun covers most tasks.
- **Sui CLI** – compiles and publishes the Move package plus signs contract calls.
- **Walrus site-builder** *(optional)* – bundles static frontends into Walrus quilts.
- **Walrus portal** *(optional)* – local gateway that lets you stage and pin blobs before pushing them on-chain.

## Install steps (macOS or Linux)

1. Install Bun: `curl -fsSL https://bun.sh/install | bash` and reload your shell.
2. Confirm npm: `npm -v`; install via your package manager if it is missing.
3. Add the Sui CLI: `cargo install --locked sui-tools` or download a release build from the Sui GitHub page.
4. Install the Walrus site-builder with `cargo install walrus-site-builder` if you plan to ship frontends from this machine.
5. Run a Walrus portal only when you need local testing: `cargo install walrus-portal` and follow the README to start the service.
6. Clone this repo, run `bun install` under `frontend` and `cli`, and run `sui client new-env` to point the CLI at your preferred network before publishing.
