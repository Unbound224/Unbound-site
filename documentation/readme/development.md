# Local development and canonical sources

This GitBook is a cross-project navigation layer. Implementation instructions, environment variables and exact tool versions live beside their code.

| Project  | Canonical docs source                                                                        |
| -------- | -------------------------------------------------------------------------------------------- |
| Sideband | [Sideband-gateway/gitbook](https://github.com/Sideband34/Sideband-gateway/tree/main/gitbook) |
| Torrent  | [Torrent-web/gitbook](https://github.com/Torrent998/Torrent-web/tree/main/gitbook)           |
| Unbound  | [Unbound-site/gitbook](../../gitbook)                                                        |

Before running any project:

1. Clone the target repository and read its README.
2. Copy only its documented example environment file; never commit a populated local environment file.
3. Use Testnet credentials and disposable assets.
4. Run the documented formatter, test and build commands.
5. Confirm deployment addresses only from a repository deployment record or a block explorer.

Git Sync configuration is prepared in each documentation-source repository through a root .gitbook.yaml file. Connect the GitBook GitHub provider to synchronize source Markdown automatically.
