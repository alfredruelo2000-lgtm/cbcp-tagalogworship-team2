import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getServices } from '@/lib/db-services.functions';
import { getSongsPublic } from '@/lib/db-public.functions';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  User, 
  Clock, 
  BookOpen, 
  StickyNote, 
  ArrowLeft,
  GripVertical,
  Trash2,
  ChevronUp,
  ChevronDown,
  Music,
  Plus,
  Info,
  Play,
  Printer,
  Copy,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  Mic2,
  Headphones,
  Users,
  MapPin,
  Mail,
  Phone,
  Settings,
  UserPlus,
  ChevronRight
} from 'lucide-react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { SetlistStatus, SetlistSong, ServiceItem, ServiceItemType, AssignmentStatus } from '@/types/setlists';
import { TeamRole } from '@/types/team';
import { cn } from '@/lib/utils';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute('/_public/setlists/$id')({
  component: SetlistDetailPage,
});

function SetlistDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => getServices(),
  });

  const { data: songs = [] } = useQuery({
    queryKey: ['songs-public'],
    queryFn: getSongsPublic,
  });

  const { data: team = [] } = useQuery({
    queryKey: ['team-full'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data;
    }
  });

  const initialSetlist = services.find((s: any) => s.id === id);
  const [setlist, setSetlist] = useState<any>(initialSetlist);
  
  // Update state when data loads
  useMemo(() => {
    if (initialSetlist && !setlist) {
      setSetlist(initialSetlist);
    }
  }, [initialSetlist, setlist]);
  const [viewMode, setViewMode] = useState<'Standard' | 'Rehearsal' | 'Musician' | 'Vocalist' | 'Presentation'>('Standard');
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<TeamRole | null>(null);

  if (!setlist) {
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <h2 className="font-serif text-3xl">Setlist not found</h2>
        <Button asChild className="mt-8 rounded-none tracking-widest uppercase">
          <Link to="/setlists">Back to Setlists</Link>
        </Button>
      </div>
    );
  }

  const getSongById = (songId: string) => songs.find((s: any) => s.id === songId);
  const getMemberById = (memberId: string) => team.find((m: any) => m.id === memberId);

  const totalDuration = (setlist.items || []).reduce((acc: number, item: any) => acc + (item.duration || 0), 0);
  const itemsWithNoDuration = (setlist.items || []).filter((item: any) => !item.duration).length;

  const getStatusColor = (status: SetlistStatus) => {
    switch (status) {
      case 'Ready': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'Draft': return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
      case 'Preparing': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'Completed': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'Archived': return 'bg-muted text-muted-foreground border-transparent';
      default: return '';
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...setlist.items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    
    const [movedItem] = newItems.splice(index, 1);
    if (!movedItem) return;
    newItems.splice(targetIndex, 0, movedItem);
    
    const updatedItems = newItems.map((item, idx) => ({ ...item, order: idx + 1 }));
    setSetlist({ ...setlist, items: updatedItems });
  };

  const removeItem = (id: string) => {
    const newItems = (setlist.items || []).filter((item: any) => item.id !== id).map((item: any, idx: number) => ({ ...item, order: idx + 1 }));
    setSetlist({ ...setlist, items: newItems });
  };

  const duplicateSetlist = () => {
    const newSetlist = {
      ...setlist,
      id: Math.random().toString(36).substring(2, 9),
      title: `${setlist.title} (Copy)`,
      status: 'Draft' as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // In a real app, this would be a server call
    alert('Setlist duplicated! (In this demo, it would navigate to the new ID)');
  };

  // Timeline calculation
  const timeline = useMemo(() => {
    let currentTime = new Date(`2000-01-01 ${setlist.serviceTime || '09:00'}`);
    return (setlist.items || []).map((item: any) => {
      const startTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      currentTime = new Date(currentTime.getTime() + (item.duration || 0) * 60000);
      return { ...item, startTime };
    });
  }, [setlist.items, setlist.serviceTime]);

  if (viewMode === 'Rehearsal') {
    const currentItem = (setlist.items || [])[activeItemIndex];
    const song = currentItem?.songId ? getSongById(currentItem.songId) : null;
    const setlistSong = song ? (setlist.songs || []).find((s: any) => (s.songId || s.song_id) === song.id) : null;

    return (
      <div className="min-h-screen bg-primary text-primary-foreground p-6 lg:p-12 animate-in fade-in duration-500">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="flex items-center justify-between border-b border-accent/20 pb-8">
            <div>
              <button 
                onClick={() => setViewMode('Standard')}
                className="flex items-center text-[10px] font-bold tracking-widest text-accent hover:text-white uppercase transition-colors mb-4"
              >
                <ArrowLeft className="mr-2 w-3 h-3" /> Exit Rehearsal Mode
              </button>
              <h1 className="font-serif text-4xl">{setlist.title}</h1>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold tracking-widest text-accent uppercase">Item {activeItemIndex + 1} of {setlist.items.length}</span>
              <p className="text-sm opacity-60">Estimated: {currentItem?.duration}m</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <div className="space-y-4">
                <Badge className="bg-accent text-primary rounded-none uppercase text-[10px] tracking-widest px-4 py-1">
                  {currentItem?.type === 'Song' ? 'Worship Song' : 'Service Item'}
                </Badge>
                <h2 className="font-serif text-5xl lg:text-7xl leading-tight">{currentItem?.title}</h2>
                
                {song && (
                  <div className="flex flex-wrap gap-8 pt-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold tracking-widest text-accent uppercase">Selected Key</p>
                      <p className="text-2xl font-serif">{setlistSong?.selectedKey || (song as any).default_key || (song as any).defaultKey}</p>
                    </div>
                    {song.bpm && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold tracking-widest text-accent uppercase">BPM</p>
                        <p className="text-2xl font-serif">{song.bpm}</p>
                      </div>
                    )}
                    {song.flow && song.flow.length > 0 && (
                      <div className="w-full space-y-2 mt-4">
                        <p className="text-[10px] font-bold tracking-widest text-accent uppercase">Song Flow</p>
                        <div className="flex flex-wrap gap-2">
                          {song.flow.map((part: any, i: number) => (
                            <span key={i} className="text-sm px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                              {part}{i < (song.flow?.length ?? 0) - 1 && ' >'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-6 pt-8 border-t border-white/10">
                {setlistSong?.transitionNote && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold tracking-widest text-accent uppercase flex items-center gap-2">
                      <Play className="w-3 h-3" /> Transition
                    </h3>
                    <p className="text-xl italic text-white/80">{setlistSong.transitionNote}</p>
                  </div>
                )}
                
                {setlistSong?.leaderNote && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold tracking-widest text-accent uppercase flex items-center gap-2">
                      <Mic2 className="w-3 h-3" /> Worship Leader Note
                    </h3>
                    <p className="text-lg text-white/80">{setlistSong.leaderNote}</p>
                  </div>
                )}

                {setlistSong?.musicianNotes && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold tracking-widest text-accent uppercase flex items-center gap-2">
                      <Headphones className="w-3 h-3" /> Musician Note
                    </h3>
                    <p className="text-lg text-white/80">{setlistSong.musicianNotes}</p>
                  </div>
                )}

                {currentItem?.notes && !song && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold tracking-widest text-accent uppercase">Notes</h3>
                    <p className="text-xl text-white/80">{currentItem.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white/5 border border-white/10 p-6 space-y-6">
                <h3 className="text-[10px] font-bold tracking-widest text-accent uppercase">Service Progress</h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {(setlist.items || []).map((item: any, idx: number) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveItemIndex(idx)}
                      className={cn(
                        "w-full text-left p-4 border transition-all duration-300",
                        activeItemIndex === idx 
                          ? "bg-accent text-primary border-accent" 
                          : "bg-transparent border-white/10 hover:border-white/30 text-white/60"
                      )}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-[10px] font-bold opacity-50">0{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-serif truncate">{item.title}</p>
                          <p className="text-[9px] uppercase tracking-widest opacity-60 mt-1">{item.duration}m</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {song && (
                <Button 
                  asChild
                  variant="outline" 
                  className="w-full rounded-none py-6 border-accent/20 text-accent hover:bg-accent hover:text-primary transition-all uppercase tracking-widest text-[10px] font-bold"
                >
                  <Link to="/songs/$id" params={{ id: song.id }}>View Full Chart</Link>
                </Button>
              )}
            </div>
          </div>

          <div className="fixed bottom-12 left-0 right-0 px-6 flex justify-center gap-4">
            <Button 
              disabled={activeItemIndex === 0}
              onClick={() => setActiveItemIndex(prev => prev - 1)}
              className="rounded-none bg-white/10 hover:bg-white/20 border-white/10 px-8 py-6 uppercase tracking-widest text-[10px] font-bold"
            >
              Previous
            </Button>
            <Button 
              disabled={activeItemIndex === setlist.items.length - 1}
              onClick={() => setActiveItemIndex(prev => prev + 1)}
              className="rounded-none bg-accent hover:bg-accent/90 text-primary px-12 py-6 uppercase tracking-widest text-[10px] font-bold"
            >
              Next Item
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-20 animate-in fade-in duration-700 print:p-0 print:m-0">
      <div className="mb-12 print:hidden">
        <Link to="/setlists" className="flex items-center text-[10px] font-bold tracking-widest text-muted-foreground hover:text-foreground uppercase transition-colors mb-8">
          <ArrowLeft className="mr-2 w-3 h-3" /> Back to Setlists
        </Link>
        
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className={`rounded-none uppercase text-[8px] tracking-widest font-bold ${getStatusColor(setlist.status)}`}>
                {setlist.status}
              </Badge>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{setlist.serviceType}</span>
            </div>
            <h1 className="font-serif text-5xl lg:text-6xl text-foreground">{setlist.title}</h1>
            <div className="flex flex-wrap gap-x-8 gap-y-4 pt-2">
              <div className="flex items-center text-sm text-muted-foreground uppercase tracking-wider">
                <Calendar className="w-4 h-4 mr-2 text-accent" />
                {new Date(setlist.serviceDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="flex items-center text-sm text-muted-foreground uppercase tracking-wider">
                <Clock className="w-4 h-4 mr-2 text-accent" />
                {setlist.serviceTime}
              </div>
              <div className="flex items-center text-sm text-muted-foreground uppercase tracking-wider">
                <User className="w-4 h-4 mr-2 text-accent" />
                Leader: {setlist.worshipLeader}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-4">
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 mb-1">
                <p className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase">Estimated Service Duration</p>
                {itemsWithNoDuration > 0 && (
                  <div className="group relative">
                    <AlertCircle className="w-3 h-3 text-amber-500 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-amber-50 rounded shadow-lg text-[9px] text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {itemsWithNoDuration} items missing duration
                    </div>
                  </div>
                )}
              </div>
              <p className="text-3xl font-serif text-foreground">
                {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={duplicateSetlist} variant="outline" size="icon" className="rounded-none border-accent/20 h-10 w-10 text-accent">
                <Copy className="w-4 h-4" />
              </Button>
              <Button onClick={() => window.print()} variant="outline" size="icon" className="rounded-none border-accent/20 h-10 w-10 text-accent">
                <Printer className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="rounded-none tracking-widest uppercase text-[10px] font-bold border-accent/20">
                Edit Details
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Print Header (Visible only when printing) */}
      <div className="hidden print:block mb-12 border-b-2 border-primary pb-8">
        <h1 className="font-serif text-4xl mb-4">{setlist.title}</h1>
        <div className="grid grid-cols-2 gap-8 text-sm uppercase tracking-widest">
          <div>
            <p><span className="font-bold">Date:</span> {setlist.serviceDate}</p>
            <p><span className="font-bold">Time:</span> {setlist.serviceTime}</p>
          </div>
          <div>
            <p><span className="font-bold">Leader:</span> {setlist.worshipLeader}</p>
            <p><span className="font-bold">Type:</span> {setlist.serviceType}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <Tabs defaultValue="order" className="w-full">
            <TabsList className="bg-transparent border-b border-accent/10 w-full justify-start rounded-none h-auto p-0 mb-8 space-x-8">
              <TabsTrigger value="order" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent rounded-none px-0 py-4 text-[10px] font-bold tracking-[0.2em] uppercase transition-all">
                Order of Service
              </TabsTrigger>
              <TabsTrigger value="team" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent rounded-none px-0 py-4 text-[10px] font-bold tracking-[0.2em] uppercase transition-all">
                Team Roster
              </TabsTrigger>
              <TabsTrigger value="rehearsal" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent rounded-none px-0 py-4 text-[10px] font-bold tracking-[0.2em] uppercase transition-all">
                Rehearsal & Setup
              </TabsTrigger>
            </TabsList>

            <TabsContent value="order" className="space-y-12 mt-0 focus-visible:outline-none">
              <section className="space-y-6">
                <div className="flex items-center justify-between border-b border-accent/10 pb-4 print:hidden">
                  <h2 className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase">Service Timeline</h2>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setViewMode('Rehearsal')}
                      variant="outline" 
                      className="bg-accent/5 text-accent border-accent/20 rounded-none text-[10px] font-bold tracking-widest uppercase hover:bg-accent hover:text-primary transition-all"
                    >
                      <Play className="w-3 h-3 mr-2" /> Rehearsal Mode
                    </Button>
                    <Button variant="ghost" className="text-[10px] font-bold tracking-widest uppercase text-accent hover:bg-accent/5">
                      <Plus className="w-3 h-3 mr-2" /> Add Item
                    </Button>
                  </div>
                </div>

            <div className="space-y-4">
              {timeline.map((item: any, idx: number) => {
                const song = item.songId ? getSongById(item.songId) : null;
                const setlistSong = song ? (setlist.songs || []).find((s: any) => (s.songId || s.song_id) === song.id) : null;

                return (
                  <div 
                    key={item.id} 
                    className={cn(
                      "group flex gap-4 p-4 lg:p-6 bg-muted/20 border border-accent/5 transition-all duration-300 relative print:bg-white print:border-b print:border-t-0 print:border-x-0 print:px-0 print:pb-6 print:mb-0",
                      song ? "border-l-4 border-l-accent" : "border-l-4 border-l-muted-foreground/20"
                    )}
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground/30 print:hidden">
                      <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0} className="hover:text-accent transition-colors disabled:opacity-0">
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <GripVertical className="w-4 h-4" />
                      <button onClick={() => moveItem(idx, 'down')} disabled={idx === setlist.items.length - 1} className="hover:text-accent transition-colors disabled:opacity-0">
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="hidden lg:block w-20 pt-1 print:block">
                      <span className="text-[11px] font-mono text-accent/60 font-bold">{item.startTime}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h4 className="text-xl font-serif text-foreground">{item.title}</h4>
                        {song && (
                          <Badge variant="secondary" className="bg-accent/10 text-accent text-[9px] uppercase tracking-tighter rounded-none">
                            {setlistSong?.category || 'Worship'}
                          </Badge>
                        )}
                        {item.assignedPerson && (
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            — {item.assignedPerson}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-6 text-[10px] text-muted-foreground uppercase tracking-widest">
                        {song && (
                          <>
                            <div className="flex items-center gap-2">
                              <Music className="w-3 h-3 text-accent/30" />
                              Key: {setlistSong?.selectedKey}
                            </div>
                            <div>BPM: {song.bpm || song.bpm || '--'}</div>
                          </>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-accent/30" />
                          {item.duration}m
                        </div>
                      </div>

                      {(setlistSong?.transitionNote || setlistSong?.leaderNote || item.notes) && (
                        <div className="mt-4 space-y-2 p-3 bg-accent/5 border-l-2 border-accent/20 italic text-[11px] text-muted-foreground print:bg-transparent print:p-0 print:mt-2">
                          {setlistSong?.transitionNote && <p><span className="font-bold uppercase text-[8px] not-italic mr-2">Transition:</span> {setlistSong.transitionNote}</p>}
                          {setlistSong?.leaderNote && <p><span className="font-bold uppercase text-[8px] not-italic mr-2">Leader Note:</span> {setlistSong.leaderNote}</p>}
                          {item.notes && !song && <p>{item.notes as string}</p>}
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                      {song && (
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-muted-foreground hover:text-accent">
                          <Link to="/songs/$id" params={{ id: song.id }}>
                            <Maximize2 className="w-4 h-4" />
                          </Link>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-accent">
                        <Info className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeItem(item.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Worship Flow Summary */}
          <section className="print:hidden">
            <h2 className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase mb-8 border-b border-accent/10 pb-4">Worship Flow Overview</h2>
            <div className="flex flex-wrap items-center gap-4 py-8 px-12 bg-primary/5 border border-accent/10">
              {timeline.map((item: any, idx: number) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-accent uppercase mb-1">{item.startTime}</p>
                    <p className="text-sm font-serif">{item.title?.split(' ')[0]?.toUpperCase() ?? 'ITEM'}</p>
                  </div>
                  {idx < timeline.length - 1 && (
                    <div className="h-px w-8 bg-accent/20" />
                  )}
                </div>
              ))}
            </div>
            </section>
          </TabsContent>
            
            <TabsContent value="team" className="space-y-12 mt-0 focus-visible:outline-none">
              <section className="space-y-8">
                <div className="flex items-center justify-between border-b border-accent/10 pb-4">
                  <h2 className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase">Team Roster</h2>
                  <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="text-[10px] font-bold tracking-widest uppercase text-accent hover:bg-accent/5">
                        <UserPlus className="w-3 h-3 mr-2" /> Assign Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] rounded-none border-accent/20 bg-background">
                      <DialogHeader>
                        <DialogTitle className="font-serif text-2xl">Assign Team Member</DialogTitle>
                        <DialogDescription className="text-[10px] uppercase tracking-widest">
                          Select a member and role for this service
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-6 space-y-6">
                        <div className="space-y-4">
                          <label className="text-[9px] font-bold tracking-[0.2em] text-accent uppercase block">Select Role</label>
                          <div className="grid grid-cols-2 gap-2">
                            {(['Worship Leader', 'Vocalist', 'Acoustic Guitar', 'Electric Guitar', 'Bass', 'Keyboard', 'Drums', 'Sound Engineer'] as TeamRole[]).map(role => (
                              <button
                                key={role}
                                onClick={() => setSelectedRole(role)}
                                className={cn(
                                  "text-[9px] font-bold tracking-widest uppercase px-3 py-2 border text-left transition-all",
                                  selectedRole === role 
                                    ? "bg-accent text-primary border-accent" 
                                    : "bg-transparent border-accent/10 text-muted-foreground hover:border-accent/30"
                                )}
                              >
                                {role}
                              </button>
                            ))}
                          </div>
                        </div>

                        {selectedRole && (
                          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-[9px] font-bold tracking-[0.2em] text-accent uppercase block">Available Members</label>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                              {team.filter((m: any) => 
                                (m.primary_role || m.primaryRole) === selectedRole || 
                                ((m.secondary_roles || m.secondaryRoles || []).includes(selectedRole as any)) ||
                                ((m.skills || []).includes(selectedRole as any))
                              ).map((member: any) => {
                                const isUnavailable = (member.availability || []).some((a: any) => a.date === setlist.serviceDate && a.status === 'Unavailable');
                                const isAlreadyAssigned = (setlist.assignments || []).some((a: any) => (a.memberId || a.member_id) === member.id);
                                
                                return (
                                  <button
                                    key={member.id}
                                    disabled={isUnavailable || isAlreadyAssigned}
                                    className={cn(
                                      "w-full flex items-center justify-between p-3 border text-left transition-all group",
                                      isUnavailable || isAlreadyAssigned 
                                        ? "opacity-40 cursor-not-allowed border-transparent bg-muted/10" 
                                        : "border-accent/5 bg-muted/20 hover:border-accent/20"
                                    )}
                                    onClick={() => {
                                      alert(`Assigned ${member.fullName} as ${selectedRole}`);
                                      setIsAssignDialogOpen(false);
                                    }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full overflow-hidden border border-accent/20">
                                        <img src={member.avatar_url || member.photoUrl} alt={member.full_name || member.fullName} className="w-full h-full object-cover" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-serif">{member.full_name || member.fullName}</p>
                                        {isUnavailable && <p className="text-[8px] text-red-500 uppercase font-bold">Unavailable</p>}
                                        {isAlreadyAssigned && <p className="text-[8px] text-accent uppercase font-bold">Already Assigned</p>}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {(member.primary_role || member.primaryRole) === selectedRole && (
                                        <Badge variant="outline" className="text-[7px] uppercase tracking-tighter border-accent/20 text-accent">Primary</Badge>
                                      )}
                                      <ChevronRight className="w-3 h-3 text-accent/30 group-hover:text-accent transition-colors" />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Worship Leaders */}
                  <div className="space-y-4">
                    <h3 className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground uppercase px-2">Worship Leaders</h3>
                    <div className="space-y-2">
                      {(setlist.assignments || [])
                        .filter((a: any) => a.role === 'Worship Leader' || a.role === 'Assistant Worship Leader')
                        .map((assignment: any) => {
                          const member = getMemberById(assignment.memberId || assignment.member_id);
                          return (
                            <div key={assignment.id} className="group flex items-center justify-between p-4 bg-muted/20 border border-accent/5 hover:border-accent/20 transition-all">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-accent/20">
                                  <img src={member?.avatar_url || (member as any)?.photoUrl} alt={member?.full_name || (member as any)?.fullName} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <p className="text-sm font-serif">{member?.full_name || (member as any)?.fullName}</p>
                                  <p className="text-[9px] text-accent uppercase tracking-widest">{assignment.role}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className={cn(
                                  "rounded-none text-[8px] uppercase tracking-widest",
                                  assignment.status === 'Confirmed' ? "text-green-600 border-green-500/20 bg-green-500/5" : "text-amber-600 border-amber-500/20 bg-amber-500/5"
                                )}>
                                  {assignment.status}
                                </Badge>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Settings className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      {(setlist.assignments || []).filter((a: any) => a.role === 'Worship Leader' || a.role === 'Assistant Worship Leader').length === 0 && (
                        <p className="text-[10px] text-muted-foreground italic px-2">No leaders assigned</p>
                      )}
                    </div>
                  </div>

                  {/* Musicians */}
                  <div className="space-y-4">
                    <h3 className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground uppercase px-2">Band</h3>
                    <div className="space-y-2">
                      {(setlist.assignments || [])
                        .filter((a: any) => ['Acoustic Guitar', 'Electric Guitar', 'Bass', 'Keyboard', 'Piano', 'Drums', 'Percussion'].includes(a.role))
                        .map((assignment: any) => {
                          const member = getMemberById(assignment.memberId || assignment.member_id);
                          return (
                            <div key={assignment.id} className="group flex items-center justify-between p-4 bg-muted/20 border border-accent/5 hover:border-accent/20 transition-all">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-accent/20">
                                  <img src={member?.avatar_url || (member as any)?.photoUrl} alt={member?.full_name || (member as any)?.fullName} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <p className="text-sm font-serif">{member?.full_name || (member as any)?.fullName}</p>
                                  <p className="text-[9px] text-accent uppercase tracking-widest">{assignment.role}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className={cn(
                                  "rounded-none text-[8px] uppercase tracking-widest",
                                  assignment.status === 'Confirmed' ? "text-green-600 border-green-500/20 bg-green-500/5" : "text-amber-600 border-amber-500/20 bg-amber-500/5"
                                )}>
                                  {assignment.status}
                                </Badge>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Settings className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="rehearsal" className="space-y-12 mt-0 focus-visible:outline-none">
              <section className="space-y-8">
                <div className="flex items-center justify-between border-b border-accent/10 pb-4">
                  <h2 className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase">Rehearsal & Call Times</h2>
                  <Button variant="ghost" className="text-[10px] font-bold tracking-widest uppercase text-accent hover:bg-accent/5">
                    <Settings className="w-3 h-3 mr-2" /> Edit Times
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div className="p-8 bg-primary/5 border border-accent/10">
                      <h3 className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase mb-6">Rehearsal Details</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Calendar className="w-4 h-4 text-accent/50" />
                          <div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Date</p>
                            <p className="text-sm">{setlist.rehearsalDate ? new Date(setlist.rehearsalDate).toLocaleDateString() : 'TBD'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Clock className="w-4 h-4 text-accent/50" />
                          <div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Time</p>
                            <p className="text-sm">{setlist.rehearsalTime || 'TBD'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <MapPin className="w-4 h-4 text-accent/50" />
                          <div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Location</p>
                            <p className="text-sm">{setlist.rehearsalLocation || 'TBD'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase px-2">Service Day Call Times</h3>
                    <div className="space-y-2">
                      {setlist.callTimes && Object.entries(setlist.callTimes).map(([role, time]) => (
                        <div key={role} className="flex items-center justify-between p-4 bg-muted/20 border border-accent/5">
                          <span className="text-[10px] font-bold uppercase tracking-widest">{role}</span>
                          <span className="text-sm font-serif text-accent">{time as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar: Service Info & Notes */}
        <div className="space-y-8 print:hidden">
          <div className="p-8 bg-primary text-primary-foreground rounded-none shadow-2xl">
            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-6 text-accent">Service Overview</h3>
            <div className="space-y-6">
              {setlist.theme && (
                <div>
                  <label className="text-[9px] font-bold tracking-[0.2em] text-accent uppercase block mb-2">Theme</label>
                  <p className="font-serif text-xl">{setlist.theme}</p>
                </div>
              )}
              {setlist.scriptureReference && (
                <div>
                  <label className="text-[9px] font-bold tracking-[0.2em] text-accent uppercase block mb-2">Scripture</label>
                  <div className="flex items-start gap-2 italic">
                    <BookOpen className="w-4 h-4 mt-1 text-accent/50 shrink-0" />
                    <span>{setlist.scriptureReference}</span>
                  </div>
                </div>
              )}
              <div className="pt-4 border-t border-white/10">
                <label className="text-[9px] font-bold tracking-[0.2em] text-accent uppercase block mb-4">Set Status</label>
                <div className="flex flex-wrap gap-2">
                  {(['Draft', 'Planning', 'Ready', 'Completed'] as SetlistStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => setSetlist({ ...setlist, status })}
                      className={cn(
                        "text-[8px] font-bold tracking-widest uppercase px-3 py-1 border transition-all",
                        setlist.status === status 
                          ? "bg-accent text-primary border-accent" 
                          : "bg-transparent border-white/20 text-white/40 hover:text-white"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-muted/30 border border-accent/10">
            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-6 text-accent">Ministry Notes</h3>
            <div className="space-y-6 text-sm text-foreground/80 leading-relaxed">
              <div className="space-y-2">
                <label className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground uppercase block">General Notes</label>
                <p>{setlist.notes || "No general notes provided for this service."}</p>
              </div>
              
              <div className="pt-6 border-t border-accent/10 space-y-2">
                <h4 className="flex items-center gap-2 text-[9px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                  <StickyNote className="w-3 h-3" /> Rehearsal Focus
                </h4>
                <p className="italic">Remember to emphasize the bridge in the final song. Watch for the transition between the second and third items.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent">Quick Templates</h3>
            <div className="grid grid-cols-1 gap-2">
              {/* Templates removed */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
