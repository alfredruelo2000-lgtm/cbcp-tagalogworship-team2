import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getResourcesPublic } from '@/lib/db-public.functions';
import { ResourceCard } from '@/components/resources/ResourceCard';
import { ResourceSearch } from '@/components/resources/ResourceSearch';
import { ResourceFilters } from '@/components/resources/ResourceFilters';
import { ResourceCategory, ResourceType } from '@/types/resources';
import { TeamRole } from '@/types/team';
import { Separator } from '@/components/ui/separator';
import { BookOpen, GraduationCap, Heart, Info } from 'lucide-react';

export const Route = createFileRoute('/_public/resources')({
  head: () => ({
    meta: [
      { title: "Ministry Resources | Radiant Worship" },
      { name: "description", content: "Access biblical devotionals, worship leader training, and technical resources to equip your ministry team." },
      { property: "og:title", content: "Ministry Resources & Training" },
    ],
  }),
  component: ResourcesLibrary,
});


function ResourcesLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<ResourceCategory | 'All'>('All');
  const [resourceType, setResourceType] = useState<ResourceType | 'All'>('All');
  const [role, setRole] = useState<TeamRole | 'All Team Members' | 'All'>('All');

  const { data: resources = [] } = useQuery({
    queryKey: ['resources-public'],
    queryFn: getResourcesPublic,
  });

  const filteredResources = useMemo(() => {
    return (resources || []).map((raw: any) => ({
      ...raw,
      resourceType: raw.resource_type || raw.resourceType,
      ministryRoles: raw.ministry_roles || raw.ministryRoles,
      createdAt: raw.created_at || raw.createdAt,
      updatedAt: raw.updated_at || raw.updatedAt
    })).filter((resource: any) => {
      const title = resource.title || '';
      const description = resource.description || '';
      const tags = resource.tags || [];
      const scripture = resource.scripture_references || [];
      const roles = resource.ministryRoles || [];

      const matchesSearch = 
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        scripture.some((ref: any) => {
          const val = typeof ref === 'string' ? ref : (ref.reference || '');
          return val.toLowerCase().includes(searchQuery.toLowerCase());
        });
      
      const matchesCategory = category === 'All' || resource.category === category;
      const matchesType = resourceType === 'All' || resource.resourceType === resourceType;
      const matchesRole = role === 'All' || roles.includes(role as any) || roles.includes('All Team Members');

      return matchesSearch && matchesCategory && matchesType && matchesRole;
    });
  }, [resources, searchQuery, category, resourceType, role]);

  const featuredResources = useMemo(() => {
    return resources.filter((r: any) => r.featured).slice(0, 2);
  }, [resources]);

  const trainingCategories = [
    { title: 'Worship Leaders', icon: Heart, description: 'Leading biblically, song selection, and pastoral leadership.' },
    { title: 'Vocalists', icon: Info, description: 'Harmony, blending, vocal care, and preparation.' },
    { title: 'Musicians', icon: GraduationCap, description: 'Rhythm, dynamics, arrangement, and rehearsal discipline.' },
    { title: 'Technical Team', icon: BookOpen, description: 'Sound basics, gain structure, and livestream.' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Header */}
      <section className="bg-primary/5 py-24 px-6 border-b border-accent/10">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <span className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase">Equipping the Saints</span>
            <h1 className="font-serif text-5xl mt-6 mb-8 text-foreground leading-tight">Worship Resources</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Biblical teaching, devotionals, training, and practical tools to help worshippers grow in faith, character, skill, and service.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 mt-16">
        {/* Training Quick Links */}
        <section className="mb-24">
          <div className="flex items-center gap-4 mb-12">
            <h2 className="font-serif text-3xl">Worship Team Training</h2>
            <Separator className="flex-1 bg-accent/10" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trainingCategories.map((cat) => (
              <div key={cat.title} className="p-8 border border-accent/10 bg-card hover:border-accent/30 transition-all group cursor-pointer">
                <cat.icon className="w-8 h-8 text-accent mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="font-serif text-xl mb-3 group-hover:text-accent transition-colors">{cat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{cat.description}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1 space-y-12">
            <div>
              <h3 className="font-serif text-2xl mb-8">Refine</h3>
              <ResourceFilters 
                selectedCategory={category}
                onCategoryChange={setCategory}
                selectedType={resourceType}
                onTypeChange={setResourceType}
                selectedRole={role}
                onRoleChange={setRole}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-16">
            {/* Search and Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <ResourceSearch value={searchQuery} onChange={setSearchQuery} />
              <div className="text-sm text-muted-foreground italic">
                Showing {filteredResources.length} resources
              </div>
            </div>

            {/* Featured Section (only if no active filtering) */}
            {searchQuery === '' && category === 'All' && resourceType === 'All' && role === 'All' && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="font-serif text-3xl text-accent">Featured Resources</h2>
                  <Separator className="flex-1 bg-accent/10" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {featuredResources.map(resource => (
                    <ResourceCard key={resource.id} resource={resource as any} />
                  ))}
                </div>
              </section>
            )}

            {/* Library Grid */}
            <section>
              <div className="flex items-center gap-4 mb-8">
                <h2 className="font-serif text-3xl">Resource Library</h2>
                <Separator className="flex-1 bg-accent/10" />
              </div>
              
              {filteredResources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {filteredResources.map(resource => (
                    <ResourceCard key={resource.id} resource={resource as any} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border border-dashed border-accent/20">
                  <p className="text-muted-foreground italic">No resources found matching your criteria.</p>
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setCategory('All');
                      setResourceType('All');
                      setRole('All');
                    }}
                    className="mt-4 text-accent text-sm font-bold uppercase tracking-widest hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
