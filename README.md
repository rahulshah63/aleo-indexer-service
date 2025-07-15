# Aleo Indexer Monorepo

Welcome to the Aleo Indexer Monorepo! This repository houses two key components for interacting with the Aleo blockchain:

1.  **Aleo Indexer**: A robust and extensible Aleo blockchain indexer CLI and framework.
2.  **Aleo Money Market Indexer Example**: An example project demonstrating the usage of the Aleo Indexer CLI and framework with a money market scenario.

---

## 📦 Aleo Indexer

This package provides the core functionality for indexing the Aleo blockchain. It's designed to be a flexible framework for building custom indexers.

For detailed information on features, installation, and usage, please refer to the dedicated **[Aleo Indexer README](aleo-indexer/README.md)**.


---

## 💡 Aleo Money Market Indexer Example

This project serves as a practical example of how to utilize the `aleo-indexer` package. It showcases how to set up an indexer for a Aleo Money Market application.

To explore the example, understand its setup, and see the `aleo-indexer` in action, please visit the **[Aleo Money Market Indexer Example README](aleo-mm-indexer-example/README.md)**.

---

## Getting Started (Monorepo Level)

To set up the entire monorepo:

1.  **Clone the repository**:
    ```bash
    git clone [https://github.com/rahulshah63/Aleo-indexer.git](https://github.com/rahulshah63/Aleo-indexer.git)
    cd Aleo-indexer # Assuming this is your monorepo root name
    ```
2.  **Install dependencies**:
    ```bash
    yarn install
    ```
    This will install dependencies for both `aleo-indexer` and `aleo-mm-indexer-example` due to the `workspaces` configuration in the root `package.json`.

---

## Contributing

We welcome contributions to this project! Please see the individual package READMEs for more specific guidelines, or open an issue in the main repository.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Issues

If you find any bugs or have feature requests, please open an issue on the main repository: [https://github.com/rahulshah63/Aleo-indexer/issues](https://github.com/rahulshah63/Aleo-indexer/issues)