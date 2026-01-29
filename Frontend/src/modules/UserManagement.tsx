import { useState, useEffect} from "react";
import { UserPlus, Edit, Trash2, Search, Loader2, AlertCircle, Check } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TeamSelector } from "@/components/TeamSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";

/*
============================================================================
INTERFACES Y TIPOS
============================================================================
Define la estructura de un usuario tal como viene de la base de datos
*/
interface User {
  User_id: number;
  Username: string;
  Role: "Admin" | "Engineer" | "Driver";
  Team_id?: number;
  Team_name?: string;
}

type UserRole = "Admin" | "Engineer" | "Driver";// Tipo para los roles disponibles en el sistema

interface FormData {// Estructura del formulario para crear/editar usuarios
  username: string;
  password: string;
  role: UserRole;
  teamId: string;
  // Pilot skill H (1-100) — only relevant when role === 'Driver'
  driverH: string;
}
/*
============================================================================
COMPONENTE PRINCIPAL
============================================================================
*/
const UserManagement = () => {
  //ESTADOS DEL COMPONENTE
  const [users, setUsers] = useState<User[]>([]);// Lista de todos los usuarios cargados desde la BD
  const [loading, setLoading] = useState(false);// Estado de carga para mostrar spinners
  const [searchQuery, setSearchQuery] = useState("");// Query de búsqueda para filtrar usuarios localmente
  const [isDialogOpen, setIsDialogOpen] = useState(false);// Query de búsqueda para filtrar usuarios localmente
  const [editingUser, setEditingUser] = useState<User | null>(null);// Usuario que se está editando (null si se está creando uno nuevo)
  const [error, setError] = useState<string | null>(null);// Mensajes de error para mostrar al usuario
  const [successMessage, setSuccessMessage] = useState<string | null>(null);// Mensajes de éxito para mostrar al usuario

  //Estado del formulario (username, password, role, teamId)
  const [formData, setFormData] = useState<FormData>({
    username: "",
    password: "",
    role: "Driver",
    teamId: "",
    driverH: "85",
  });
  
  /*
  ============================================================================
  EFECTOS (useEffect)
  ============================================================================
  */
  useEffect(() => {// Cargar usuarios al montar el componente
    fetchUsers();
  }, []);

  // ============================================================================
  // FUNCIONES DE API
  // ============================================================================
  const fetchUsers = async () => {// Obtiene todos los usuarios de la base de datos
    try {
      setLoading(true);
      setError(null);
      
      console.log('[USERS] Fetching all users...');
      
      const { res, data } = await apiFetch('/api/sp/users');
      
      if (res.ok && data.success) {
        console.log(`Loaded ${data.data.length} users`);
        setUsers(data.data);
      } else {
        setError('Error al cargar usuarios');
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // FILTRADO LOCAL
  // ============================================================================
  // Filtra usuarios en el cliente (sin llamadas a API) basado en searchQuery
  // Busca coincidencias en: Username, Role, y Team_name
  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.Username.toLowerCase().includes(searchLower) ||
      user.Role.toLowerCase().includes(searchLower) ||
      (user.Team_name && user.Team_name.toLowerCase().includes(searchLower))
    );
  });

  // ============================================================================
  // HANDLERS DE FORMULARIO
  // ============================================================================
  // Maneja el envío del formulario (crear o actualizar usuario)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    //Validaciones básicas del formulario
    if (!formData.username.trim()) {
      setError('Username es requerido');
      return;
    }
    
    if (!editingUser && !formData.password.trim()) {
      setError('Password es requerido para nuevos usuarios');
      return;
    }
    
    // ⚠️ CAMBIO: Ya NO validamos que teamId sea obligatorio
    // Ahora Engineer y Driver pueden crearse sin equipo

    // If creating a Driver, validate pilot skill H (1-100)
    if (!editingUser && formData.role === 'Driver') {
      const hVal = Number(formData.driverH);
      if (!formData.driverH || isNaN(hVal) || hVal < 1 || hVal > 100) {
        setError('Driver H must be a number between 1 and 100');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      if (editingUser) {
        //MODO EDICIÓN: Actualizar usuario existente
        console.log(`[UPDATE] Updating user ${editingUser.User_id}`);
        
        const body: any = {// Construir body solo con campos que cambiaron
          username: formData.username !== editingUser.Username ? formData.username : undefined,
          role: formData.role !== editingUser.Role ? formData.role : undefined,
          teamId: formData.teamId ? parseInt(formData.teamId) : null, // ✅ Permite null
        };
        
        //Solo incluir password si el usuario ingresó uno nuevo
        if (formData.password.trim()) {
          body.password = formData.password;
        }
        
        const { res, data } = await apiFetch(`/api/sp/users/${editingUser.User_id}/update`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
        
        if (res.ok && data.success) {
          console.log('User updated successfully');
          setSuccessMessage('Usuario actualizado exitosamente');
          await fetchUsers();// Recargar lista
          resetForm();// Limpiar formulario
        } else {
          setError(data.error || 'Error al actualizar usuario');
        }
      } else {
        // ============================================================================
        // MODO CREACIÓN: Crear nuevo usuario
        // =========================================================================
        console.log(`[CREATE] Creating new user: ${formData.username}`);
        const { res, data } = await apiFetch('/api/sp/users/create', {
          method: 'POST',
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
            role: formData.role,
            teamId: formData.teamId ? parseInt(formData.teamId) : null, // ✅ Permite null
            driverH: formData.role === 'Driver' ? (formData.driverH ? parseInt(formData.driverH) : 85) : undefined,
          })
        });
        
        if (res.ok && data.success) {
          console.log('✅ User created successfully');
          setSuccessMessage('Usuario creado exitosamente');
          await fetchUsers();// Recargar lista
          resetForm();// Limpiar formulario
        } else {
          setError(data.error || 'Error al crear usuario');
        }
      }
    } catch (err: any) {
      console.error('Error submitting form:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /// ============================================================================
  // UTILIDADES DE FORMULARIO
  // ============================================================================
  // Limpia el formulario y cierra el diálogo
  const resetForm = () => {
    setFormData({ username: "", password: "", role: "Driver", teamId: "", driverH: "85" });
    setEditingUser(null);
    setIsDialogOpen(false);
    setError(null);
  };

  // Carga los datos del usuario en el formulario para editar
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.Username,
      password: "",// Vacío porque no queremos mostrar la contraseña actual
      role: user.Role,
      teamId: user.Team_id?.toString() || "",
      // driverH not provided by GET users — default to 85 for editing context
      driverH: "85"
    });
    setIsDialogOpen(true);
    setError(null);
    setSuccessMessage(null);
  };

  // ============================================================================
  // HANDLER DE ELIMINACIÓN
  // ============================================================================
  // Elimina un usuario después de confirmar
  // Handle delete
  const handleDelete = async (userId: number, username: string) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${username}"?`)) {// Confirmación antes de eliminar
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      console.log(`[DELETE] Deleting user ${userId}`);
      
      const { res, data } = await apiFetch(`/api/sp/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (res.ok && data.success) {
        console.log('✅ User deleted successfully');
        setSuccessMessage('Usuario eliminado exitosamente');
        await fetchUsers();// Recargar lista
      } else {
        setError(data.error || 'Error al eliminar usuario');
      }
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "Admin":
        return "destructive"; //Rojo
      case "Engineer":
        return "default"; //Azul
      case "Driver":
        return "secondary"; //Gris
      default:
        return "outline";
    }
  };

   // ============================================================================
  // RENDER DEL COMPONENTE
  // ============================================================================
  return (
    <MainLayout>
      <div className="p-8">
        {/* HEADER - Título y botón de crear usuario */}
        <div className="flex items-center justify-between mb-8 opacity-0 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              User Management
            </h1>
            <p className="text-muted-foreground">
              Manage system users and role assignments
            </p>
          </div>

          {/* DIÁLOGO DE CREAR/EDITAR USUARIO */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="racing" 
                onClick={() => { 
                  setEditingUser(null); 
                  setFormData({ username: "", password: "", role: "Driver", teamId: "", driverH: "85" });
                  setError(null);
                  setSuccessMessage(null);
                }}
              >
                <UserPlus className="w-5 h-5" />
                NEW USER
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-border">
              <DialogHeader>
                <DialogTitle className="font-display text-foreground">
                  {editingUser ? "Edit User" : "Create New User"}
                </DialogTitle>
              </DialogHeader>
              
              {/* ============================================================================ */}
              {/* FORMULARIO */}
              {/* ============================================================================ */}
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {/* Mensajes de error dentro del diálogo */}
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {successMessage && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <p className="text-sm text-green-400">{successMessage}</p>
                    </div>
                  </div>
                )}

                {/* Campo: Username */}
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Enter username"
                    required
                    className="bg-accent/50"
                    disabled={loading}
                  />
                </div>

                {/* Campo: Password */}
                <div className="space-y-2">
                  <Label>
                    Password 
                    {editingUser && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (Leave empty to keep current)
                      </span>
                    )}
                  </Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? "Enter new password (optional)" : "Enter password"}
                    required={!editingUser}
                    className="bg-accent/50"
                    disabled={loading}
                  />
                </div>

                {/*Campo: Role */}
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => {
                      setFormData({ ...formData, role: value as UserRole });
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger className="bg-accent/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Engineer">Engineer</SelectItem>
                      <SelectItem value="Driver">Driver</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Team (only for Engineer/Driver) */}
                {(formData.role === "Engineer" || formData.role === "Driver") && (
                  <div className="space-y-2">
                    <Label>
                      Assigned Team
                      <span className="text-xs text-muted-foreground ml-2">(Optional)</span>
                    </Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        {formData.teamId ? (
                          // Mostrar TeamSelector con valor cuando hay equipo seleccionado
                          <TeamSelector
                            value={formData.teamId}
                            onChange={(teamId) => setFormData({ ...formData, teamId: teamId || "" })}
                            placeholder="Seleccionar equipo..."
                            required={false}
                          />
                        ) : (
                          // Mostrar TeamSelector vacío cuando no hay equipo
                          <TeamSelector
                            value=""
                            onChange={(teamId) => setFormData({ ...formData, teamId: teamId || "" })}
                            placeholder="No asignar equipo"
                            required={false}
                          />
                        )}
                      </div>
                      {formData.teamId && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setFormData({ ...formData, teamId: "" })}
                          disabled={loading}
                          title="Quitar equipo asignado"
                          className="shrink-0"
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                    {!formData.teamId && (
                      <p className="text-xs text-muted-foreground">
                        Sin equipo asignado
                      </p>
                    )}
                  </div>
                )}

                {/* Pilot Skill H (only for Driver) */}
                {formData.role === "Driver" && (
                  <div className="space-y-2">
                    <Label>Pilot Skill (H)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={formData.driverH}
                        onChange={(e) => setFormData({...formData, driverH: e.target.value})}
                        className="bg-accent/50 w-32"
                        disabled={loading}
                      />
                      <p className="text-sm text-muted-foreground">Value 1-100 (default 85)</p>
                    </div>
                  </div>
                )}

                {/* Pilot Skill H (only for Driver) */}
                {formData.role === "Driver" && (
                  <div className="space-y-2">
                    <Label>Pilot Skill (H)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={formData.driverH}
                        onChange={(e) => setFormData({...formData, driverH: e.target.value})}
                        className="bg-accent/50 w-32"
                        disabled={loading}
                      />
                      <p className="text-sm text-muted-foreground">Value 1-100 (default 85)</p>
                    </div>
                  </div>
                )}

                {/* Pilot Skill H (only for Driver) */}
                {formData.role === "Driver" && (
                  <div className="space-y-2">
                    <Label>Pilot Skill (H)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={formData.driverH}
                        onChange={(e) => setFormData({...formData, driverH: e.target.value})}
                        className="bg-accent/50 w-32"
                        disabled={loading}
                      />
                      <p className="text-sm text-muted-foreground">Value 1-100 (default 85)</p>
                    </div>
                  </div>
                )}

                {/* Pilot Skill H (only for Driver) */}
                {formData.role === "Driver" && (
                  <div className="space-y-2">
                    <Label>Pilot Skill (H)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={formData.driverH}
                        onChange={(e) => setFormData({...formData, driverH: e.target.value})}
                        className="bg-accent/50 w-32"
                        disabled={loading}
                      />
                      <p className="text-sm text-muted-foreground">Value 1-100 (default 85)</p>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm} 
                    className="flex-1"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="racing" 
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {editingUser ? "Save Changes" : "Create User"}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* MENSAJES GLOBALES (fuera del diálogo) */}
        {error && !isDialogOpen && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {successMessage && !isDialogOpen && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              <p className="text-green-400">{successMessage}</p>
            </div>
          </div>
        )}

        {/* BARRA DE BÚSQUEDA */}
        <div className="relative mb-6 opacity-0 animate-fade-in" style={{ animationDelay: "250ms" }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search users by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border max-w-md"
            disabled={loading}
          />
        </div>

        {/* CONTADOR DE RESULTADOS */}
        {users.length > 0 && (
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        )}

        {/* TABLA USUARIOS */}
        <div className="glass-card rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
          {/* Estado: Cargando */}
          {loading && users.length === 0 ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin mb-4" />
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery ? `No users found for "${searchQuery}"` : "No users found"}
              </p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")} 
                  className="mt-4 text-sm text-primary hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            /*Estado: Mostrando usuarios*/
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground min-w-[200px]">User</TableHead>
                    <TableHead className="text-muted-foreground min-w-[120px]">Role</TableHead>
                    <TableHead className="text-muted-foreground min-w-[150px]">Team</TableHead>
                    <TableHead className="text-muted-foreground text-right min-w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Se cambia users.map por filteredUsers.map para una óptima búsqueda. Mapeo de usuarios filtrados*/}
                  {filteredUsers.map((user) => (
                    <TableRow key={user.User_id} className="border-border hover:bg-accent/20 transition-colors">
                      {/* Columna: Usuario */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-display font-bold text-primary">
                              {user.Username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.Username}</p>
                            <p className="text-xs text-muted-foreground">
                              ID: {user.User_id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{/*Columna: Rol, según color.*/}
                        <Badge variant={getRoleBadgeVariant(user.Role)}>
                          {user.Role}
                        </Badge>
                      </TableCell> {/*Equipo asignado*/}
                      <TableCell className="font-medium text-foreground">
                        {user.Team_name || (
                          <span className="text-muted-foreground italic">No asignado</span>
                        )}
                      </TableCell> 
                      <TableCell className="text-right">{/*Acciones (editar/eliminar)*/}
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEdit(user)}
                            disabled={loading}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user.User_id, user.Username)}
                            className="text-destructive hover:text-destructive"
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default UserManagement;