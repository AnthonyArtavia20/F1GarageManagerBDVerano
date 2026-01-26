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

interface User {
  User_id: number;
  Username: string;
  Role: "Admin" | "Engineer" | "Driver";
  Team_id?: number;
  Team_name?: string;
}

type UserRole = "Admin" | "Engineer" | "Driver";

interface FormData {
  username: string;
  password: string;
  role: UserRole;
  teamId: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    username: "",
    password: "",
    role: "Driver",
    teamId: "",
  });
  
  // Cargar usuarios al montar
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[USERS] Fetching all users...');
      
      const { res, data } = await apiFetch('/api/sp/users');
      
      if (res.ok && data.success) {
        console.log(`✅ Loaded ${data.data.length} users`);
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

  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.Username.toLowerCase().includes(searchLower) ||
      user.Role.toLowerCase().includes(searchLower) ||
      (user.Team_name && user.Team_name.toLowerCase().includes(searchLower))
    );
  });

  // Create or Update user
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.username.trim()) {
      setError('Username es requerido');
      return;
    }
    
    if (!editingUser && !formData.password.trim()) {
      setError('Password es requerido para nuevos usuarios');
      return;
    }
    
    if ((formData.role === 'Engineer' || formData.role === 'Driver') && !formData.teamId) {
      setError('Team es requerido para Engineer y Driver');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      if (editingUser) {
        // UPDATE
        console.log(`[UPDATE] Updating user ${editingUser.User_id}`);
        
        const body: any = {
          username: formData.username !== editingUser.Username ? formData.username : undefined,
          role: formData.role !== editingUser.Role ? formData.role : undefined,
          teamId: formData.teamId ? parseInt(formData.teamId) : undefined,
        };
        
        // Solo incluir password si cambió
        if (formData.password.trim()) {
          body.password = formData.password;
        }
        
        const { res, data } = await apiFetch(`/api/sp/users/${editingUser.User_id}/update`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
        
        if (res.ok && data.success) {
          console.log('✅ User updated successfully');
          setSuccessMessage('Usuario actualizado exitosamente');
          await fetchUsers();
          resetForm();
        } else {
          setError(data.error || 'Error al actualizar usuario');
        }
      } else {
        // CREATE
        console.log(`[CREATE] Creating new user: ${formData.username}`);
        
        const { res, data } = await apiFetch('/api/sp/users/create', {
          method: 'POST',
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
            role: formData.role,
            teamId: formData.teamId ? parseInt(formData.teamId) : null,
          })
        });
        
        if (res.ok && data.success) {
          console.log('✅ User created successfully');
          setSuccessMessage('Usuario creado exitosamente');
          await fetchUsers();
          resetForm();
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

  // Reset form
  const resetForm = () => {
    setFormData({ username: "", password: "", role: "Driver", teamId: "" });
    setEditingUser(null);
    setIsDialogOpen(false);
    setError(null);
  };

  // Handle edit
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.Username,
      password: "",
      role: user.Role,
      teamId: user.Team_id?.toString() || "",
    });
    setIsDialogOpen(true);
    setError(null);
    setSuccessMessage(null);
  };

  // Handle delete
  const handleDelete = async (userId: number, username: string) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${username}"?`)) {
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
        await fetchUsers();
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
        return "destructive";
      case "Engineer":
        return "default";
      case "Driver":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 opacity-0 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              User Management
            </h1>
            <p className="text-muted-foreground">
              Manage system users and role assignments
            </p>
          </div>

          {/* Create User Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="racing" 
                onClick={() => { 
                  setEditingUser(null); 
                  setFormData({ username: "", password: "", role: "Driver", teamId: "" });
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
              
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {/* Error Message */}
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

                {/* Username */}
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

                {/* Password */}
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

                {/* Role */}
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
                    <Label>Assigned Team</Label>
                    <TeamSelector
                      value={formData.teamId}
                      onChange={(teamId, teamName) => setFormData({ ...formData, teamId })}
                      placeholder="Select team..."
                      required={true}
                    />
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

        {/* Global Messages */}
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

        {/* Search */}
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

        {/*Mostrar estadísticas de filtrado */}
        {users.length > 0 && (
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        )}

        {/* Users Table */}
        <div className="glass-card rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
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
                  {/* ✅ CAMBIAR users.map por filteredUsers.map */}
                  {filteredUsers.map((user) => (
                    <TableRow key={user.User_id} className="border-border hover:bg-accent/20 transition-colors">
                      {/* ... resto del código de la fila sin cambios ... */}
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
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.Role)}>
                          {user.Role}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {user.Team_name || (
                          <span className="text-muted-foreground italic">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
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