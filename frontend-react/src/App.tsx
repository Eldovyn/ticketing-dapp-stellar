import { useState, useEffect } from "react";
import * as Freighter from "@stellar/freighter-api";
import * as StellarSdk from "@stellar/stellar-sdk";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, Wallet, PlusCircle, RefreshCw, Trash2, CheckCircle, ShieldAlert } from "lucide-react";

const CONTRACT_ID = "CCEKCBRXZBIBVZA6DVWMGHAD3PMCJEQW44BD6TMQQO2TE2CRIADFL4QP";
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const RPC_URL = "https://soroban-testnet.stellar.org";

interface TicketData {
  id: number;
  title: string;
  description: string;
  assignee: string | null;
}

export default function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [tickets, setTickets] = useState<TicketData[]>([
    {
      id: 1001,
      title: "Update Smart Contract Tests",
      description: "Add more coverage for the delete_ticket function edge cases.",
      assignee: null
    },
    {
      id: 1002,
      title: "Design Frontend UI",
      description: "Implement Shadcn UI components for a modern look.",
      assignee: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const simulateNetworkDelay = () => new Promise(res => setTimeout(res, 800));

  const handleConnect = async () => {
    try {
      const isInstalled = await Freighter.isAllowed();
      if (!isInstalled) {
        toast.error("Freighter is not installed or allowed.");
        return;
      }
      
      const access = await Freighter.requestAccess();
      if (access.error) throw new Error(access.error);

      const network = await Freighter.getNetworkDetails();
      if (network.network !== 'TESTNET') {
        toast.warning("Please switch Freighter to Testnet!");
      }

      setAddress(access.address);
      setIsOwner(true); // For testing purposes, we assume any connected wallet is the owner
      toast.success("Wallet Connected Successfully");
    } catch (e: any) {
      toast.error(`Failed to connect wallet: ${e.message}`);
    }
  };

  const handleInitContract = async () => {
    if (!address) return;
    try {
      setIsLoading(true);
      toast.info('Preparing init transaction...');

      const horizon = new StellarSdk.Horizon.Server(HORIZON_URL);
      const rpcServer = new StellarSdk.SorobanRpc.Server(RPC_URL);
      
      const account = await horizon.loadAccount(address);
      const contract = new StellarSdk.Contract(CONTRACT_ID);
      
      const params = [
          new StellarSdk.Address(address).toScVal()
      ];
      
      const operation = contract.call("init", ...params);
      
      let tx = new StellarSdk.TransactionBuilder(account, {
          fee: "1000",
          networkPassphrase: NETWORK_PASSPHRASE
      })
      .addOperation(operation)
      .setTimeout(30)
      .build();

      let preparedTx;
      if (typeof rpcServer.prepareTransaction === 'function') {
          preparedTx = await rpcServer.prepareTransaction(tx);
      } else {
          const simulated = await rpcServer.simulateTransaction(tx);
          if (StellarSdk.SorobanRpc.Api.isSimulationError(simulated)) throw new Error("Simulation failed");
          preparedTx = StellarSdk.assembleTransaction(tx, NETWORK_PASSPHRASE, simulated).build();
      }

      toast.info('Please approve init in Freighter...');
      const signedResponse = await Freighter.signTransaction(preparedTx.toXDR(), { networkPassphrase: NETWORK_PASSPHRASE });
      if (signedResponse.error) throw new Error(signedResponse.error);

      const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedResponse.signedTxXdr || signedResponse, NETWORK_PASSPHRASE);
      
      toast.info('Submitting init...');
      const response = await rpcServer.sendTransaction(signedTx);
      
      if (response.status === "ERROR") throw new Error("Init transaction failed.");
      
      let status = "PENDING";
      while (status === "PENDING") {
          await simulateNetworkDelay();
          const getResponse = await rpcServer.getTransaction(response.hash);
          status = getResponse.status;
      }

      if (status === "SUCCESS") {
          setIsInitialized(true);
          toast.success('Contract Initialized Successfully!');
      } else {
          throw new Error(`Init failed: ${status}`);
      }

    } catch (e: any) {
      toast.error(`Init Error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !title || !desc) return;

    try {
      setIsLoading(true);
      toast.info('Preparing create_ticket transaction...');

      const horizon = new StellarSdk.Horizon.Server(HORIZON_URL);
      const rpcServer = new StellarSdk.SorobanRpc.Server(RPC_URL);
      
      const account = await horizon.loadAccount(address);
      const contract = new StellarSdk.Contract(CONTRACT_ID);
      
      const params = [
          new StellarSdk.Address(address).toScVal(),
          StellarSdk.nativeToScVal(title, { type: 'string' }),
          StellarSdk.nativeToScVal(desc, { type: 'string' })
      ];
      
      const operation = contract.call("create_ticket", ...params);
      
      let tx = new StellarSdk.TransactionBuilder(account, {
          fee: "1000",
          networkPassphrase: NETWORK_PASSPHRASE
      })
      .addOperation(operation)
      .setTimeout(30)
      .build();
      
      let preparedTx;
      if (typeof rpcServer.prepareTransaction === 'function') {
          preparedTx = await rpcServer.prepareTransaction(tx);
      } else {
          const simulated = await rpcServer.simulateTransaction(tx);
          if (StellarSdk.SorobanRpc.Api.isSimulationError(simulated)) throw new Error("Simulation failed");
          preparedTx = StellarSdk.assembleTransaction(tx, NETWORK_PASSPHRASE, simulated).build();
      }
      
      toast.info('Please approve in Freighter...');
      const signedResponse = await Freighter.signTransaction(preparedTx.toXDR(), { networkPassphrase: NETWORK_PASSPHRASE });
      if (signedResponse.error) throw new Error(signedResponse.error);
      
      const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedResponse.signedTxXdr || signedResponse, NETWORK_PASSPHRASE);
      
      toast.info('Submitting to blockchain...');
      const response = await rpcServer.sendTransaction(signedTx);
      
      if (response.status === "ERROR") throw new Error("Transaction submission failed.");
      
      let status = "PENDING";
      while (status === "PENDING") {
          await simulateNetworkDelay();
          const getResponse = await rpcServer.getTransaction(response.hash);
          status = getResponse.status;
      }
      
      if (status === "SUCCESS") {
          toast.success('Ticket successfully created on blockchain!');
          setTickets(prev => [...prev, {
              id: Math.floor(Math.random() * 10000),
              title,
              description: desc,
              assignee: null
          }]);
          setTitle("");
          setDesc("");
      } else {
          throw new Error(`Transaction failed: ${status}`);
      }

    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async (id: number) => {
    try {
      toast.info(`Claiming ticket #${id}...`);
      await simulateNetworkDelay(); // MOCK
      setTickets(prev => prev.map(t => t.id === id ? { ...t, assignee: address } : t));
      toast.success(`Ticket #${id} claimed successfully!`);
    } catch (e) {
      toast.error("Error claiming ticket");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      toast.info(`Deleting ticket #${id}...`);
      await simulateNetworkDelay(); // MOCK
      setTickets(prev => prev.filter(t => t.id !== id));
      toast.success(`Ticket #${id} deleted`);
    } catch (e) {
      toast.error("Error deleting ticket");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden font-sans">
      {/* Background Animated Blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <Toaster position="bottom-right" theme="dark" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <Ticket className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gradient">Stellar Tickets</h1>
            <Badge variant="secondary" className="ml-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">TESTNET</Badge>
          </div>
          <Button 
            onClick={handleConnect} 
            variant={address ? "outline" : "default"}
            className={address ? "glass-card border-white/10" : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-0 shadow-lg shadow-indigo-500/25"}
          >
            <Wallet className="mr-2 h-4 w-4" />
            {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : "Connect Wallet"}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 space-y-12 relative z-10">
        
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto py-8">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Decentralized <span className="text-gradient">Task Management</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Create, claim, and resolve tickets securely on the Stellar Soroban network with complete transparency.
          </p>
        </div>

        {/* Init Section */}
        {address && !isInitialized && (
          <Card className="glass-card border-destructive/30 bg-destructive/5 max-w-3xl mx-auto shadow-destructive/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="h-6 w-6 animate-pulse" />
                Contract Initialization Required
              </CardTitle>
              <CardDescription className="text-destructive/80 text-base">
                The smart contract has not been initialized yet. You must initialize it to become the Owner and gain permission to create tickets.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={handleInitContract} disabled={isLoading} variant="destructive" className="w-full sm:w-auto shadow-lg shadow-destructive/20">
                Initialize Contract Now
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Owner Dashboard */}
        {isOwner && (
          <Card className="glass-card max-w-3xl mx-auto overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl">Create New Ticket</CardTitle>
              <CardDescription>Issue a new task to the decentralized network.</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <form onSubmit={handleCreateTicket} className="space-y-5">
                <div className="space-y-2">
                  <Input 
                    placeholder="Ticket Title (e.g. Fix Login Bug)" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    required 
                    className="bg-background/50 border-white/10 focus-visible:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Textarea 
                    placeholder="Detailed description of the task..." 
                    value={desc} 
                    onChange={e => setDesc(e.target.value)} 
                    required 
                    className="bg-background/50 border-white/10 focus-visible:ring-indigo-500 min-h-[100px]"
                  />
                </div>
                <Button type="submit" disabled={isLoading || !address} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20 border-0 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Issue Ticket to Network
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tickets Grid */}
        <div className="space-y-6 pt-8">
          <div className="flex justify-between items-end border-b border-white/5 pb-4">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight">Active Tasks</h2>
              <p className="text-muted-foreground text-sm">Browse and claim available tasks</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.info('Refreshed!')} className="glass-card border-white/10">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
          
          {tickets.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground glass-card border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center">
              <Ticket className="h-12 w-12 opacity-20 mb-4" />
              <p className="text-lg">No tickets found on the network.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tickets.map(ticket => (
                <Card key={ticket.id} className="glass-card flex flex-col hover:-translate-y-1 hover:shadow-2xl hover:border-white/20 group">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className={ticket.assignee ? "bg-secondary/50 text-secondary-foreground border-transparent" : "bg-primary/20 text-primary border-primary/30"}>
                        {ticket.assignee ? "Claimed" : "Open"}
                      </Badge>
                      <span className="text-xs text-muted-foreground/60 font-mono bg-white/5 px-2 py-1 rounded-md">#{ticket.id}</span>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{ticket.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground/80 leading-relaxed">{ticket.description}</p>
                    {ticket.assignee && (
                      <div className="mt-6 text-xs bg-black/40 border border-white/5 p-3 rounded-lg font-mono overflow-hidden text-ellipsis flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="opacity-70">Assignee:</span> <span className="text-indigo-300">{ticket.assignee.substring(0,8)}...</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex gap-3 pt-4 border-t border-white/5">
                    {!ticket.assignee && (
                      <Button onClick={() => handleClaim(ticket.id)} className="flex-1 bg-white/10 hover:bg-white/20 text-white border-0 transition-all">
                        <CheckCircle className="mr-2 h-4 w-4" /> Claim
                      </Button>
                    )}
                    {isOwner && (
                      <Button onClick={() => handleDelete(ticket.id)} variant="destructive" size="icon" className="shadow-lg shadow-destructive/20 hover:scale-105 transition-transform">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
