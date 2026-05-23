# Stellar Task Ticketing DApp

**Stellar Task Ticketing DApp** - Blockchain-Based Decentralized Ticket Management System

## Project Description

Stellar Task Ticketing DApp is a decentralized smart contract solution built on the Stellar blockchain using the Soroban SDK. It provides a secure, transparent platform for managing tasks and support tickets directly on the blockchain. The contract implements Role-Based Access Control (RBAC), ensuring that only authorized administrators (Owners) can create or delete tickets, while allowing any staff member or user to claim and take responsibility for open tasks.

The system allows users to track all tickets, claim unassigned work, and verify task delegation, leveraging the efficiency and security of the Stellar network. Each ticket is uniquely identified and stored within the contract's instance storage, ensuring reliable and tamper-proof task management.

## Project Vision

Our vision is to revolutionize project and task management in the Web3 space by:

- **Decentralizing Workflows**: Moving task allocation from centralized databases to a global, distributed blockchain.
- **Ensuring Transparent Delegation**: Providing a permanent, tamper-proof record of who created a task and who claimed it.
- **Streamlining Collaboration**: Empowering decentralized teams to claim and execute tasks in a trustless environment.
- **Guaranteeing Accountability**: Creating a system where task assignment is publicly verifiable and secured by cryptography.

We envision a future where decentralized autonomous organizations (DAOs) and distributed teams can manage their operations seamlessly and transparently.

## Key Features

### 1. **Role-Based Access Control (RBAC)**
- Automated initialization setting a designated "Owner" for the contract.
- Strict permission checks ensuring only the Owner can create and delete tickets.
- Publicly accessible functions for viewing and claiming open tickets.

### 2. **Secure Ticket Creation**
- Owner-exclusive ticket generation.
- Specify a clear `title` and `description` for each task.
- Automated, secure pseudo-random ID generation for unique identification.
- Tickets are created with an "Unassigned" status by default.

### 3. **Decentralized Task Claiming**
- Staff and contributors can claim open tickets via the `claim_ticket` function.
- Smart contract logic prevents double-claiming (a ticket cannot be claimed if an assignee already exists).
- Automatically binds the caller's blockchain address to the ticket as the `assignee`.

### 4. **Efficient Data Retrieval**
- Fetch all stored tickets and their current statuses in a single call.
- Structured data representation (ID, Title, Description, Assignee) for easy frontend integration.
- Real-time synchronization with the blockchain state.

### 5. **Stellar Network Integration**
- Leverages the high speed and low cost of the Stellar network.
- Built using the modern, Rust-based Soroban Smart Contract SDK.

## Contract Details

- **Contract ID:** `CCEKCBRXZBIBVZA6DVWMGHAD3PMCJEQW44BD6TMQQO2TE2CRIADFL4QP`
- **Network:** Stellar Soroban (Testnet/Futurenet)

## Future Scope

### Short-Term Enhancements
1. **Ticket Status Updates**: Add functionality for assignees to update ticket progress (e.g., "In Progress", "Review", "Completed").
2. **Unclaim/Reassign Function**: Allow assignees to drop a ticket or the Owner to reassign it to a different address.
3. **Category & Priority Tags**: Add priority levels (Low, Medium, High) to help assignees choose the most urgent tasks.

### Medium-Term Development
4. **Bounty Integration**: Attach Stellar (XLM) or custom tokens to tickets, automatically paying the assignee upon ticket completion.
5. **Deadline Enforcement**: Implement timestamp-based deadlines for claimed tickets.
6. **Multi-Admin Support**: Allow the primary Owner to whitelist other addresses as "Managers" who can also create and delete tickets.

### Long-Term Vision
7. **DAO Governance**: Allow community voting to prioritize which tickets should be created or funded.
8. **Cross-Contract Workflows**: Integrate with other Soroban contracts to trigger actions automatically when a ticket is resolved.
9. **Decentralized Identity (DID)**: Map Stellar addresses to human-readable identities or verified contributor profiles.

---

## Technical Requirements

- Soroban SDK
- Rust programming language
- Stellar blockchain network

## Getting Started

Deploy the smart contract to Stellar's Soroban network. The contract flow revolves around these core functions:

- `init(owner)` - Initializes the contract and sets the administrator address (can only be called once).
- `get_tickets()` - Retrieve all open and claimed tickets from the contract.
- `create_ticket(caller, title, description)` - Create a new task (Restricted to Owner).
- `claim_ticket(caller, id)` - Claim an unassigned task using its unique ID (Open to any user).
- `delete_ticket(caller, id)` - Remove a specific ticket from the system (Restricted to Owner).

---

**Stellar Task Ticketing DApp** - Organizing Decentralized Work on the Blockchain