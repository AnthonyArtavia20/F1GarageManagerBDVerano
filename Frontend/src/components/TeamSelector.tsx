// Frontend/src/components/TeamSelector.tsx
import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9090';

interface Team {
  Team_id: number;
  Name: string;
}

interface TeamSelectorProps {
  value: string;
  onChange: (teamId: string, teamName: string) => void;
  placeholder?: string;
  required?: boolean;
}

export const TeamSelector = ({ 
  value, 
  onChange, 
  placeholder = "Search and select team...",
  required = false 
}: TeamSelectorProps) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTeamName, setSelectedTeamName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar equipos inicialmente
  useEffect(() => {
    fetchTeams();
  }, []);

  // Buscar equipos cuando cambia el texto
  useEffect(() => {
    if (search.trim() === '') {
      setFilteredTeams(teams);
    } else {
      searchTeams(search);
    }
  }, [search, teams]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Obtener todos los equipos
  const fetchTeams = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sp/teams`); // CORREGIDO: /api/sp/teams
      const data = await response.json();
      
      if (data.success) {
        setTeams(data.data);
        setFilteredTeams(data.data);
      }
    } catch (err) {
      console.error('Error al cargar equipos:', err);
    }
  };

  // Buscar equipos con filtro
  const searchTeams = async (searchTerm: string) => {
    try {
      const response = await fetch( // CORREGIDO: /api/sp/teams/search
        `${API_URL}/api/sp/teams/search?search=${encodeURIComponent(searchTerm)}`
      );
      const data = await response.json();
      
      if (data.success) {
        setFilteredTeams(data.data);
      }
    } catch (err) {
      console.error('Error al buscar equipos:', err);
      // Fallback: filtrar localmente
      const filtered = teams.filter(team =>
        team.Name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTeams(filtered);
    }
  };

  // Manejar selección
  const handleSelect = (team: Team) => {
    onChange(team.Team_id.toString(), team.Name);
    setSelectedTeamName(team.Name);
    setSearch('');
    setIsOpen(false);
  };

  // Limpiar selección
  const handleClear = () => {
    onChange('', '');
    setSelectedTeamName('');
    setSearch('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Input Principal */}
      <div 
        className="relative cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-full px-3 py-2 bg-background border border-border rounded-lg flex items-center justify-between">
          <span className={selectedTeamName ? 'text-foreground' : 'text-muted-foreground'}>
            {selectedTeamName || placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
        {required && !value && (
          <span className="text-xs text-red-400 mt-1">Required field</span>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Barra de búsqueda */}
          <div className="p-2 border-b border-border sticky top-0 bg-card">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Type to search teams..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background"
                autoFocus
              />
            </div>
          </div>

          {/* Lista de equipos */}
          <div className="overflow-y-auto max-h-48">
            {filteredTeams.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                {search ? `No teams found for "${search}"` : 'No teams available'}
              </div>
            ) : (
              <>
                {filteredTeams.map((team) => (
                  <div
                    key={team.Team_id}
                    onClick={() => handleSelect(team)}
                    className={`
                      px-4 py-2 cursor-pointer transition-colors
                      hover:bg-primary/10
                      ${value === team.Team_id.toString() ? 'bg-primary/20 font-semibold' : ''}
                    `}
                  >
                    {team.Name}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Botón limpiar */}
          {selectedTeamName && (
            <div className="p-2 border-t border-border">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="w-full px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};