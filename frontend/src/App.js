import { useState, useEffect } from "react";
import "@/App.css";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Badge } from "./components/ui/badge";
import { Separator } from "./components/ui/separator";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Textarea } from "./components/ui/textarea";
import { Trash2, Home, Users, Heart, BarChart3, Plus } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [pisos, setPisos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [coincidencias, setCoincidencias] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Estados para formularios
  const [pisoForm, setPisoForm] = useState({
    cliente: '',
    telefono: '',
    poblacion: '',
    calle_zona: '',
    precio: '',
    metros: '',
    habitaciones: '',
    estado: 'buen_estado',
    ascensor: false,
    planta: '',
    garaje: false,
    balcon_terraza: false,
    observaciones: ''
  });
  
  const [clienteForm, setClienteForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    presupuesto_maximo: '',
    zona_preferida: '',
    habitaciones_minimas: '',
    metros_minimos: '',
    prefiere_ascensor: 'indiferente',
    prefiere_garaje: 'indiferente',
    prefiere_exterior: 'indiferente',
    observaciones: ''
  });

  // Funciones para cargar datos
  const cargarPisos = async () => {
    try {
      const response = await axios.get(`${API}/pisos`);
      setPisos(response.data);
    } catch (error) {
      console.error('Error cargando pisos:', error);
      toast.error('Error al cargar pisos');
    }
  };

  const cargarClientes = async () => {
    try {
      const response = await axios.get(`${API}/clientes`);
      setClientes(response.data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      toast.error('Error al cargar clientes');
    }
  };

  const cargarCoincidencias = async () => {
    try {
      const response = await axios.get(`${API}/coincidencias`);
      setCoincidencias(response.data);
    } catch (error) {
      console.error('Error cargando coincidencias:', error);
      toast.error('Error al cargar coincidencias');
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Funciones para crear elementos
  const crearPiso = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const pisoData = {
        ...pisoForm,
        precio: parseFloat(pisoForm.precio),
        metros: parseInt(pisoForm.metros),
        habitaciones: parseInt(pisoForm.habitaciones),
        planta: parseInt(pisoForm.planta)
      };
      
      await axios.post(`${API}/pisos`, pisoData);
      toast.success('Piso añadido correctamente');
      
      // Limpiar formulario
      setPisoForm({
        cliente: '', telefono: '', poblacion: '', calle_zona: '',
        precio: '', metros: '', habitaciones: '', estado: 'buen_estado',
        ascensor: false, planta: '', garaje: false, balcon_terraza: false,
        observaciones: ''
      });
      
      // Recargar datos
      await Promise.all([cargarPisos(), cargarCoincidencias(), cargarEstadisticas()]);
      
    } catch (error) {
      console.error('Error creando piso:', error);
      toast.error('Error al crear piso');
    } finally {
      setLoading(false);
    }
  };

  const crearCliente = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const clienteData = {
        ...clienteForm,
        presupuesto_maximo: parseFloat(clienteForm.presupuesto_maximo),
        habitaciones_minimas: parseInt(clienteForm.habitaciones_minimas),
        metros_minimos: parseInt(clienteForm.metros_minimos)
      };
      
      await axios.post(`${API}/clientes`, clienteData);
      toast.success('Cliente registrado correctamente');
      
      // Limpiar formulario
      setClienteForm({
        nombre: '', telefono: '', email: '', presupuesto_maximo: '',
        zona_preferida: '', habitaciones_minimas: '', metros_minimos: '',
        prefiere_ascensor: 'indiferente', prefiere_garaje: 'indiferente',
        prefiere_exterior: 'indiferente', observaciones: ''
      });
      
      // Recargar datos
      await Promise.all([cargarClientes(), cargarCoincidencias(), cargarEstadisticas()]);
      
    } catch (error) {
      console.error('Error creando cliente:', error);
      toast.error('Error al registrar cliente');
    } finally {
      setLoading(false);
    }
  };

  // Funciones para eliminar
  const eliminarPiso = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este piso?')) return;
    
    try {
      await axios.delete(`${API}/pisos/${id}`);
      toast.success('Piso eliminado');
      await Promise.all([cargarPisos(), cargarCoincidencias(), cargarEstadisticas()]);
    } catch (error) {
      console.error('Error eliminando piso:', error);
      toast.error('Error al eliminar piso');
    }
  };

  const eliminarCliente = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este cliente?')) return;
    
    try {
      await axios.delete(`${API}/clientes/${id}`);
      toast.success('Cliente eliminado');
      await Promise.all([cargarClientes(), cargarCoincidencias(), cargarEstadisticas()]);
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      toast.error('Error al eliminar cliente');
    }
  };

  const desactivarCoincidencia = async (id) => {
    try {
      await axios.delete(`${API}/coincidencias/${id}`);
      toast.success('Coincidencia desactivada');
      await cargarCoincidencias();
    } catch (error) {
      console.error('Error desactivando coincidencia:', error);
      toast.error('Error al desactivar coincidencia');
    }
  };

  useEffect(() => {
    const cargarTodosDatos = async () => {
      await Promise.all([
        cargarPisos(),
        cargarClientes(), 
        cargarCoincidencias(),
        cargarEstadisticas()
      ]);
    };
    
    cargarTodosDatos();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sistema de Pisos</h1>
                <p className="text-sm text-gray-600">Gestión inteligente de propiedades y matching automático</p>
              </div>
            </div>
            
            {/* Stats rápidas */}
            <div className="flex space-x-6 text-sm">
              <div className="text-center">
                <div className="font-semibold text-lg text-blue-600">{stats.total_pisos || 0}</div>
                <div className="text-gray-600">Pisos</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg text-green-600">{stats.total_clientes || 0}</div>
                <div className="text-gray-600">Clientes</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg text-red-600">{stats.total_coincidencias || 0}</div>
                <div className="text-gray-600">Coincidencias</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="pisos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="pisos" className="flex items-center space-x-2">
              <Home className="w-4 h-4" />
              <span>Pisos</span>
            </TabsTrigger>
            <TabsTrigger value="solicitudes" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Solicitudes</span>
            </TabsTrigger>
            <TabsTrigger value="coincidencias" className="flex items-center space-x-2">
              <Heart className="w-4 h-4" />
              <span>Coincidencias</span>
            </TabsTrigger>
            <TabsTrigger value="registro" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Registro</span>
            </TabsTrigger>
          </TabsList>

          {/* Sección Pisos */}
          <TabsContent value="pisos" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Formulario Añadir Piso */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Añadir Nuevo Piso</span>
                  </CardTitle>
                  <CardDescription>Registra una nueva propiedad en el sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={crearPiso} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cliente">Cliente</Label>
                        <Input
                          id="cliente"
                          value={pisoForm.cliente}
                          onChange={(e) => setPisoForm({...pisoForm, cliente: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input
                          id="telefono"
                          value={pisoForm.telefono}
                          onChange={(e) => setPisoForm({...pisoForm, telefono: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="poblacion">Población</Label>
                        <Input
                          id="poblacion"
                          value={pisoForm.poblacion}
                          onChange={(e) => setPisoForm({...pisoForm, poblacion: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="calle_zona">Calle/Zona</Label>
                        <Input
                          id="calle_zona"
                          value={pisoForm.calle_zona}
                          onChange={(e) => setPisoForm({...pisoForm, calle_zona: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="precio">Precio (€)</Label>
                        <Input
                          id="precio"
                          type="number"
                          value={pisoForm.precio}
                          onChange={(e) => setPisoForm({...pisoForm, precio: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="metros">Metros²</Label>
                        <Input
                          id="metros"
                          type="number"
                          value={pisoForm.metros}
                          onChange={(e) => setPisoForm({...pisoForm, metros: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="habitaciones">Habitaciones</Label>
                        <Input
                          id="habitaciones"
                          type="number"
                          value={pisoForm.habitaciones}
                          onChange={(e) => setPisoForm({...pisoForm, habitaciones: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="estado">Estado</Label>
                        <Select value={pisoForm.estado} onValueChange={(value) => setPisoForm({...pisoForm, estado: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nuevo">Nuevo</SelectItem>
                            <SelectItem value="buen_estado">Buen Estado</SelectItem>
                            <SelectItem value="reformar">A Reformar</SelectItem>
                            <SelectItem value="obra_nueva">Obra Nueva</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="planta">Planta</Label>
                        <Input
                          id="planta"
                          type="number"
                          value={pisoForm.planta}
                          onChange={(e) => setPisoForm({...pisoForm, planta: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="flex space-x-6">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pisoForm.ascensor}
                          onChange={(e) => setPisoForm({...pisoForm, ascensor: e.target.checked})}
                          className="rounded"
                        />
                        <span>Ascensor</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pisoForm.garaje}
                          onChange={(e) => setPisoForm({...pisoForm, garaje: e.target.checked})}
                          className="rounded"
                        />
                        <span>Garaje</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pisoForm.balcon_terraza}
                          onChange={(e) => setPisoForm({...pisoForm, balcon_terraza: e.target.checked})}
                          className="rounded"
                        />
                        <span>Balcón/Terraza</span>
                      </label>
                    </div>
                    
                    <div>
                      <Label htmlFor="observaciones">Observaciones</Label>
                      <Textarea
                        id="observaciones"
                        value={pisoForm.observaciones}
                        onChange={(e) => setPisoForm({...pisoForm, observaciones: e.target.value})}
                        rows={3}
                      />
                    </div>
                    
                    <Button type="submit" disabled={loading} className="w-full" data-testid="submit-piso-btn">
                      {loading ? 'Añadiendo...' : 'Añadir Piso'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Lista de Pisos */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Pisos Registrados ({pisos.length})</CardTitle>
                  <CardDescription>Lista de todas las propiedades en el sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {pisos.map((piso) => (
                      <div key={piso.id} className="bg-gray-50 p-4 rounded-lg border">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{piso.calle_zona}, {piso.poblacion}</h4>
                            <p className="text-sm text-gray-600">{piso.cliente} - {piso.telefono}</p>
                            <div className="flex space-x-4 text-sm mt-2">
                              <span className="font-medium text-green-600">{piso.precio}€</span>
                              <span>{piso.metros}m²</span>
                              <span>{piso.habitaciones} hab.</span>
                              <span>Planta {piso.planta}</span>
                            </div>
                            <div className="flex space-x-2 mt-2">
                              <Badge variant="outline">{piso.estado}</Badge>
                              {piso.ascensor && <Badge variant="secondary">Ascensor</Badge>}
                              {piso.garaje && <Badge variant="secondary">Garaje</Badge>}
                              {piso.balcon_terraza && <Badge variant="secondary">Balcón/Terraza</Badge>}
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => eliminarPiso(piso.id)}
                            data-testid={`delete-piso-${piso.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {piso.observaciones && (
                          <p className="text-sm text-gray-700 italic mt-2">"{piso.observaciones}"</p>
                        )}
                      </div>
                    ))}
                    {pisos.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No hay pisos registrados aún</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sección Solicitudes */}
          <TabsContent value="solicitudes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Formulario Cliente */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Nueva Solicitud</span>
                  </CardTitle>
                  <CardDescription>Registra un nuevo cliente y sus preferencias</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={crearCliente} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nombre">Nombre</Label>
                        <Input
                          id="nombre"
                          value={clienteForm.nombre}
                          onChange={(e) => setClienteForm({...clienteForm, nombre: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="telefono_cliente">Teléfono</Label>
                        <Input
                          id="telefono_cliente"
                          value={clienteForm.telefono}
                          onChange={(e) => setClienteForm({...clienteForm, telefono: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={clienteForm.email}
                        onChange={(e) => setClienteForm({...clienteForm, email: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="presupuesto_maximo">Presupuesto Máximo (€)</Label>
                        <Input
                          id="presupuesto_maximo"
                          type="number"
                          value={clienteForm.presupuesto_maximo}
                          onChange={(e) => setClienteForm({...clienteForm, presupuesto_maximo: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="zona_preferida">Zona Preferida</Label>
                        <Input
                          id="zona_preferida"
                          value={clienteForm.zona_preferida}
                          onChange={(e) => setClienteForm({...clienteForm, zona_preferida: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="habitaciones_minimas">Habitaciones Mínimas</Label>
                        <Input
                          id="habitaciones_minimas"
                          type="number"
                          value={clienteForm.habitaciones_minimas}
                          onChange={(e) => setClienteForm({...clienteForm, habitaciones_minimas: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="metros_minimos">Metros Mínimos</Label>
                        <Input
                          id="metros_minimos"
                          type="number"
                          value={clienteForm.metros_minimos}
                          onChange={(e) => setClienteForm({...clienteForm, metros_minimos: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="prefiere_ascensor">Ascensor</Label>
                        <Select value={clienteForm.prefiere_ascensor} onValueChange={(value) => setClienteForm({...clienteForm, prefiere_ascensor: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="si">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                            <SelectItem value="indiferente">Indiferente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="prefiere_garaje">Garaje</Label>
                        <Select value={clienteForm.prefiere_garaje} onValueChange={(value) => setClienteForm({...clienteForm, prefiere_garaje: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="si">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                            <SelectItem value="indiferente">Indiferente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="prefiere_exterior">Exterior</Label>
                        <Select value={clienteForm.prefiere_exterior} onValueChange={(value) => setClienteForm({...clienteForm, prefiere_exterior: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="si">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                            <SelectItem value="indiferente">Indiferente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="observaciones_cliente">Observaciones</Label>
                      <Textarea
                        id="observaciones_cliente"
                        value={clienteForm.observaciones}
                        onChange={(e) => setClienteForm({...clienteForm, observaciones: e.target.value})}
                        rows={3}
                      />
                    </div>
                    
                    <Button type="submit" disabled={loading} className="w-full" data-testid="submit-cliente-btn">
                      {loading ? 'Registrando...' : 'Registrar Cliente'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Lista de Clientes */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Solicitudes Activas ({clientes.length})</CardTitle>
                  <CardDescription>Clientes buscando propiedades</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {clientes.map((cliente) => (
                      <div key={cliente.id} className="bg-gray-50 p-4 rounded-lg border">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{cliente.nombre}</h4>
                            <p className="text-sm text-gray-600">{cliente.telefono} - {cliente.email}</p>
                            <div className="flex space-x-4 text-sm mt-2">
                              <span className="font-medium text-green-600">Max: {cliente.presupuesto_maximo}€</span>
                              <span>{cliente.zona_preferida}</span>
                              <span>Min: {cliente.habitaciones_minimas} hab.</span>
                              <span>Min: {cliente.metros_minimos}m²</span>
                            </div>
                            <div className="flex space-x-2 mt-2">
                              {cliente.prefiere_ascensor !== 'indiferente' && (
                                <Badge variant="outline">Ascensor: {cliente.prefiere_ascensor}</Badge>
                              )}
                              {cliente.prefiere_garaje !== 'indiferente' && (
                                <Badge variant="outline">Garaje: {cliente.prefiere_garaje}</Badge>
                              )}
                              {cliente.prefiere_exterior !== 'indiferente' && (
                                <Badge variant="outline">Exterior: {cliente.prefiere_exterior}</Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => eliminarCliente(cliente.id)}
                            data-testid={`delete-cliente-${cliente.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {cliente.observaciones && (
                          <p className="text-sm text-gray-700 italic mt-2">"{cliente.observaciones}"</p>
                        )}
                      </div>
                    ))}
                    {clientes.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No hay solicitudes registradas aún</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sección Coincidencias */}
          <TabsContent value="coincidencias" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span>Coincidencias Activas ({coincidencias.length})</span>
                </CardTitle>
                <CardDescription>Matches automáticos entre pisos y clientes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {coincidencias.map((match) => (
                    <div key={match.coincidencia.id} className="border border-red-200 bg-red-50 p-6 rounded-lg">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-2">
                          <Heart className="w-5 h-5 text-red-500" />
                          <h3 className="font-semibold text-lg text-red-700">
                            Match encontrado - {(match.coincidencia.puntuacion_match * 100).toFixed(0)}% compatibilidad
                          </h3>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => desactivarCoincidencia(match.coincidencia.id)}
                          data-testid={`delete-match-${match.coincidencia.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Datos del Piso */}
                        <div className="bg-white p-4 rounded border">
                          <h4 className="font-semibold text-blue-700 mb-2 flex items-center space-x-2">
                            <Home className="w-4 h-4" />
                            <span>Piso</span>
                          </h4>
                          <p className="font-medium">{match.piso.calle_zona}, {match.piso.poblacion}</p>
                          <p className="text-sm text-gray-600">{match.piso.cliente} - {match.piso.telefono}</p>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                            <span><strong>Precio:</strong> {match.piso.precio}€</span>
                            <span><strong>Metros:</strong> {match.piso.metros}m²</span>
                            <span><strong>Habitaciones:</strong> {match.piso.habitaciones}</span>
                            <span><strong>Planta:</strong> {match.piso.planta}</span>
                          </div>
                          <div className="flex space-x-2 mt-2">
                            {match.piso.ascensor && <Badge variant="secondary" className="text-xs">Ascensor</Badge>}
                            {match.piso.garaje && <Badge variant="secondary" className="text-xs">Garaje</Badge>}
                            {match.piso.balcon_terraza && <Badge variant="secondary" className="text-xs">Balcón</Badge>}
                          </div>
                        </div>
                        
                        {/* Datos del Cliente */}
                        <div className="bg-white p-4 rounded border">
                          <h4 className="font-semibold text-green-700 mb-2 flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>Cliente</span>
                          </h4>
                          <p className="font-medium">{match.cliente.nombre}</p>
                          <p className="text-sm text-gray-600">{match.cliente.telefono} - {match.cliente.email}</p>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                            <span><strong>Presupuesto:</strong> {match.cliente.presupuesto_maximo}€</span>
                            <span><strong>Zona:</strong> {match.cliente.zona_preferida}</span>
                            <span><strong>Min hab:</strong> {match.cliente.habitaciones_minimas}</span>
                            <span><strong>Min m²:</strong> {match.cliente.metros_minimos}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Detalles del Match */}
                      <div className="mt-4 p-4 bg-white border rounded">
                        <h5 className="font-semibold mb-2">Detalles del Match:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                          {Object.entries(match.coincidencia.detalles_match).map(([key, value]) => (
                            key !== 'puntuacion_total' && (
                              <div key={key} className={`p-2 rounded ${
                                value.toString().startsWith('✓') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                <strong>{key}:</strong> {value}
                              </div>
                            )
                          ))}
                        </div>
                        <div className="mt-2 p-2 bg-gray-100 rounded text-center font-medium">
                          {match.coincidencia.detalles_match.puntuacion_total}
                        </div>
                      </div>
                      
                      <div className="mt-3 text-xs text-gray-500 text-center">
                        Coincidencia detectada el {new Date(match.coincidencia.fecha_match).toLocaleString('es-ES')}
                      </div>
                    </div>
                  ))}
                  
                  {coincidencias.length === 0 && (
                    <div className="text-center py-12">
                      <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No hay coincidencias activas</p>
                      <p className="text-gray-400 text-sm mt-2">Las coincidencias aparecerán automáticamente cuando se registren pisos o clientes compatibles</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sección Registro */}
          <TabsContent value="registro" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-blue-600">Pisos Totales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.total_pisos || 0}</div>
                  <p className="text-sm text-gray-600">Propiedades registradas</p>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-green-600">Clientes Activos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.total_clientes || 0}</div>
                  <p className="text-sm text-gray-600">Solicitudes pendientes</p>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-red-600">Coincidencias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.total_coincidencias || 0}</div>
                  <p className="text-sm text-gray-600">Matches encontrados</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Histórico combinado */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Registro Histórico</CardTitle>
                <CardDescription>Todos los datos registrados en el sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="historico-pisos">
                  <TabsList className="mb-4">
                    <TabsTrigger value="historico-pisos">Pisos</TabsTrigger>
                    <TabsTrigger value="historico-clientes">Clientes</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="historico-pisos">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {pisos.map((piso) => (
                        <div key={piso.id} className="flex justify-between items-center p-3 bg-blue-50 rounded border">
                          <div>
                            <span className="font-medium">{piso.calle_zona}, {piso.poblacion}</span>
                            <span className="text-sm text-gray-600 ml-4">{piso.cliente}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(piso.created_at).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="historico-clientes">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {clientes.map((cliente) => (
                        <div key={cliente.id} className="flex justify-between items-center p-3 bg-green-50 rounded border">
                          <div>
                            <span className="font-medium">{cliente.nombre}</span>
                            <span className="text-sm text-gray-600 ml-4">{cliente.zona_preferida}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(cliente.created_at).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;