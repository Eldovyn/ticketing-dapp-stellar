// Configuration
const CONTRACT_ID = "CCEKCBRXZBIBVZA6DVWMGHAD3PMCJEQW44BD6TMQQO2TE2CRIADFL4QP";
const NETWORK_PASSPHRASE = "Test SDF Future Network ; October 2022"; // Futurenet/Testnet
const HORIZON_URL = "https://rpc-futurenet.stellar.org";

// App State
let userAddress = null;
let isOwner = false; // We'll mock the owner check
let contractOwner = "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"; // Mock owner

// DOM Elements
const connectBtn = document.getElementById('connectWalletBtn');
const networkBadge = document.getElementById('networkBadge');
const ownerDashboard = document.getElementById('ownerDashboard');
const initSection = document.getElementById('initSection');
const createTicketForm = document.getElementById('createTicketForm');
const submitTicketBtn = document.getElementById('submitTicketBtn');
const refreshBtn = document.getElementById('refreshBtn');
const ticketsContainer = document.getElementById('ticketsContainer');
const emptyState = document.getElementById('emptyState');
const toastContainer = document.getElementById('toastContainer');
const initContractBtn = document.getElementById('initContractBtn');

// Mock Data for UI demonstration
let mockTickets = [
    {
        id: 1001,
        title: "Update Smart Contract Tests",
        description: "Add more coverage for the delete_ticket function edge cases.",
        assignee: null
    },
    {
        id: 1002,
        title: "Design Frontend UI",
        description: "Create a beautiful glassmorphism UI for the ticketing system.",
        assignee: "GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789"
    }
];
let isInitialized = true; // Set to false to show init section

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Check if already connected omitted for now
    renderTickets();

    if (!isInitialized) {
        initSection.classList.remove('hidden');
    }
});

// Check if Freighter is installed
async function isFreighterInstalled() {
    if (!window.freighterApi) return false;
    const { isConnected } = await window.freighterApi.isConnected();
    return isConnected;
}

// Connect Wallet Handler
connectBtn.addEventListener('click', async () => {
    try {
        setLoading(connectBtn, true);

        // Check if Freighter is available
        const connected = await isFreighterInstalled();
        if (!connected) {
            showToast('Freighter is not installed. Please install Freighter Extension.', 'error');
            return;
        }

        // Request access (prompts the Freighter popup)
        const access = await window.freighterApi.requestAccess();
        if (access.error) {
            showToast('Wallet connection rejected by user', 'error');
            return;
        }

        // Get Network Details and check if it's testnet
        const network = await window.freighterApi.getNetworkDetails();
        if (network.network !== 'TESTNET') {
            showToast('Please switch your Freighter wallet to Testnet!', 'error');
        }

        // Get the Public Key from Freighter
        userAddress = access.address;

        // Demo purpose: Make user the owner if they match contractOwner (or just mock it)
        // isOwner = await getContractOwner() === userAddress;

        updateUIState();
        showToast('Wallet Connected Successfully', 'success');
    } catch (error) {
        console.error(error);
        showToast('Failed to connect wallet', 'error');
    } finally {
        setLoading(connectBtn, false);
    }
});

function updateUIState() {
    if (userAddress) {
        const shortAddr = `${userAddress.substring(0, 5)}...${userAddress.substring(userAddress.length - 4)}`;
        connectBtn.textContent = shortAddr;
        connectBtn.classList.remove('btn-primary');
        connectBtn.classList.add('btn-outline');
        networkBadge.classList.remove('hidden');

        if (isOwner) {
            ownerDashboard.classList.remove('hidden');
        }

        renderTickets(); // Re-render to show action buttons based on auth
    }
}

// Create Ticket
createTicketForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!userAddress || !isOwner) return;

    const title = document.getElementById('ticketTitle').value;
    const desc = document.getElementById('ticketDescription').value;

    try {
        setLoading(submitTicketBtn, true);

        // MOCK CONTRACT CALL
        // Real code would use stellar-sdk to build a transaction calling create_ticket
        await simulateNetworkDelay();

        const newTicket = {
            id: Math.floor(Math.random() * 10000),
            title: title,
            description: desc,
            assignee: null
        };

        mockTickets.push(newTicket);

        showToast('Ticket created successfully!', 'success');
        createTicketForm.reset();
        renderTickets();

    } catch (error) {
        showToast('Failed to create ticket', 'error');
    } finally {
        setLoading(submitTicketBtn, false);
    }
});

// Initialize Contract (Owner only typically)
initContractBtn.addEventListener('click', async () => {
    if (!userAddress) {
        showToast('Please connect wallet first', 'error');
        return;
    }

    try {
        setLoading(initContractBtn, true);
        await simulateNetworkDelay();
        isInitialized = true;
        initSection.classList.add('hidden');
        showToast('Contract Initialized!', 'success');
    } catch (e) {
        showToast('Init failed', 'error');
    } finally {
        setLoading(initContractBtn, false);
    }
});

// Refresh Tickets
refreshBtn.addEventListener('click', async () => {
    refreshBtn.style.transform = 'rotate(180deg)';
    refreshBtn.style.transition = 'transform 0.5s';

    // MOCK: Fetch tickets from contract
    await simulateNetworkDelay(500);
    renderTickets();

    setTimeout(() => {
        refreshBtn.style.transform = 'none';
        refreshBtn.style.transition = 'none';
    }, 500);
});

// Render Tickets to DOM
function renderTickets() {
    ticketsContainer.innerHTML = '';

    if (mockTickets.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    const template = document.getElementById('ticketTemplate');

    mockTickets.forEach(ticket => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.ticket-card');

        // Populate Data
        clone.querySelector('.t-id').textContent = ticket.id;
        clone.querySelector('.ticket-title').textContent = ticket.title;
        clone.querySelector('.ticket-desc').textContent = ticket.description;

        const statusBadge = clone.querySelector('.ticket-status');
        const assigneeSpan = clone.querySelector('.t-assignee');
        const claimBtn = clone.querySelector('.claim-btn');
        const deleteBtn = clone.querySelector('.delete-btn');

        if (ticket.assignee) {
            statusBadge.textContent = 'Claimed';
            statusBadge.classList.add('status-claimed');
            const shortA = `${ticket.assignee.substring(0, 5)}...${ticket.assignee.substring(ticket.assignee.length - 4)}`;
            assigneeSpan.textContent = shortA;
        } else {
            statusBadge.textContent = 'Open';
            statusBadge.classList.add('status-open');

            // Can claim if logged in
            if (userAddress) {
                claimBtn.classList.remove('hidden');
                claimBtn.addEventListener('click', () => handleClaim(ticket.id, claimBtn));
            }
        }

        // Only owner can delete
        if (isOwner) {
            deleteBtn.classList.remove('hidden');
            deleteBtn.addEventListener('click', () => handleDelete(ticket.id, deleteBtn));
        }

        ticketsContainer.appendChild(clone);
    });
}

// Handle Claiming
async function handleClaim(id, btnElement) {
    try {
        const originalText = btnElement.textContent;
        btnElement.textContent = '...';
        btnElement.disabled = true;

        await simulateNetworkDelay();

        // MOCK UPDATE
        const ticket = mockTickets.find(t => t.id === id);
        if (ticket) {
            ticket.assignee = userAddress;
        }

        showToast(`Successfully claimed ticket #${id}`, 'success');
        renderTickets();
    } catch (e) {
        showToast('Error claiming ticket', 'error');
        btnElement.textContent = 'Claim';
        btnElement.disabled = false;
    }
}

// Handle Deletion
async function handleDelete(id, btnElement) {
    if (!confirm('Are you sure you want to delete this ticket?')) return;

    try {
        const originalText = btnElement.textContent;
        btnElement.textContent = '...';
        btnElement.disabled = true;

        await simulateNetworkDelay();

        // MOCK DELETE
        mockTickets = mockTickets.filter(t => t.id !== id);

        showToast(`Ticket #${id} deleted`, 'success');
        renderTickets();
    } catch (e) {
        showToast('Error deleting ticket', 'error');
        btnElement.textContent = 'Delete';
        btnElement.disabled = false;
    }
}

// UI Utilities
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <div class="toast-content">${message}</div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function setLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        // Keep text but show loader, or just swap
        if (button.querySelector('.btn-text')) {
            button.querySelector('.btn-text').classList.add('hidden');
            button.querySelector('.loader').classList.remove('hidden');
        } else {
            button.dataset.originalText = button.textContent;
            button.textContent = 'Processing...';
        }
    } else {
        button.disabled = false;
        if (button.querySelector('.btn-text')) {
            button.querySelector('.btn-text').classList.remove('hidden');
            button.querySelector('.loader').classList.add('hidden');
        } else {
            button.textContent = button.dataset.originalText;
        }
    }
}

function simulateNetworkDelay(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
