#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol, Vec};

// Struktur data tiket
#[contracttype]
#[derive(Clone, Debug)]
pub struct Ticket {
    pub id: u64,
    pub title: String,
    pub description: String,
    pub assignee: Option<Address>, // None = Belum diklaim, Some(Address) = Sudah diklaim
}

// Storage keys
const TICKET_DATA: Symbol = symbol_short!("TICKETS");
const OWNER_DATA: Symbol = symbol_short!("OWNER");

#[contract]
pub struct TicketContract;

#[contractimpl]
impl TicketContract {
    // 0. INITIALIZE: Menentukan owner saat pertama kali contract di-deploy
    pub fn init(env: Env, owner: Address) {
        if env.storage().instance().has(&OWNER_DATA) {
            panic!("Error: Contract sudah diinisialisasi");
        }
        env.storage().instance().set(&OWNER_DATA, &owner);
    }

    // 1. CEK TICKET: Mengambil daftar semua tiket (Bisa diakses siapa saja)
    pub fn get_tickets(env: Env) -> Vec<Ticket> {
        env.storage().instance().get(&TICKET_DATA).unwrap_or(Vec::new(&env))
    }

    // 2. CREATE TICKET: Membuat tiket baru (HANYA OWNER)
    pub fn create_ticket(env: Env, caller: Address, title: String, description: String) -> String {
        caller.require_auth(); // Verifikasi tanda tangan pemanggil

        let owner: Address = env.storage().instance().get(&OWNER_DATA).unwrap();
        if caller != owner {
            panic!("Error: Hanya Owner yang diizinkan membuat tiket!");
        }

        let mut tickets: Vec<Ticket> = Self::get_tickets(env.clone());
        
        let new_ticket = Ticket {
            id: env.prng().gen::<u64>(),
            title,
            description,
            assignee: None, // Otomatis bernilai None (kosong) saat pertama dibuat
        };
        
        tickets.push_back(new_ticket);
        env.storage().instance().set(&TICKET_DATA, &tickets);
        
        String::from_str(&env, "Tiket berhasil dibuat oleh Owner")
    }

    // 3. CLAIM TICKET: Mengambil alih tiket untuk dikerjakan (Bisa dilakukan siapa saja/staf)
    pub fn claim_ticket(env: Env, caller: Address, id: u64) -> String {
        caller.require_auth();

        let mut tickets: Vec<Ticket> = Self::get_tickets(env.clone());
        let mut found = false;

        for i in 0..tickets.len() {
            let mut ticket = tickets.get(i).unwrap();
            
            if ticket.id == id {
                // Cek apakah tiket sudah diklaim orang lain
                if ticket.assignee.is_some() {
                    panic!("Error: Tiket ini sudah diklaim dan sedang dikerjakan!");
                }

                // Masukkan alamat pemanggil sebagai assignee
                ticket.assignee = Some(caller.clone());
                tickets.set(i, ticket);
                found = true;
                break;
            }
        }

        if found {
            env.storage().instance().set(&TICKET_DATA, &tickets);
            String::from_str(&env, "Tiket berhasil diklaim")
        } else {
            panic!("Error: Tiket tidak ditemukan");
        }
    }

    // 4. DELETE TICKET: Menghapus tiket dari sistem (HANYA OWNER)
    pub fn delete_ticket(env: Env, caller: Address, id: u64) -> String {
        caller.require_auth(); // Verifikasi tanda tangan pemanggil

        let owner: Address = env.storage().instance().get(&OWNER_DATA).unwrap();
        if caller != owner {
            panic!("Error: Hanya Owner yang diizinkan menghapus tiket!");
        }

        let mut tickets: Vec<Ticket> = Self::get_tickets(env.clone());
        let mut found = false;

        for i in 0..tickets.len() {
            if tickets.get(i).unwrap().id == id {
                tickets.remove(i);
                found = true;
                break;
            }
        }

        if found {
            env.storage().instance().set(&TICKET_DATA, &tickets);
            String::from_str(&env, "Tiket berhasil dihapus oleh Owner")
        } else {
            panic!("Error: Tiket tidak ditemukan");
        }
    }
}

mod test;