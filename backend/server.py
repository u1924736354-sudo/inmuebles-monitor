from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Pisos Matching System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class EstadoPiso(str, Enum):
    nuevo = "nuevo"
    buen_estado = "buen_estado"
    reformar = "reformar"
    obra_nueva = "obra_nueva"

class PreferenciaEnum(str, Enum):
    si = "si"
    no = "no"
    indiferente = "indiferente"

# Models para Pisos
class Piso(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    fecha: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime('%Y-%m-%d'))
    cliente: str
    telefono: str
    poblacion: str
    calle_zona: str
    precio: float
    metros: int
    habitaciones: int
    estado: EstadoPiso
    ascensor: bool
    planta: int
    garaje: bool
    balcon_terraza: bool
    observaciones: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PisoCreate(BaseModel):
    cliente: str
    telefono: str
    poblacion: str
    calle_zona: str
    precio: float
    metros: int
    habitaciones: int
    estado: EstadoPiso
    ascensor: bool
    planta: int
    garaje: bool
    balcon_terraza: bool
    observaciones: Optional[str] = ""

# Models para Clientes/Solicitudes
class ClienteSolicitud(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    telefono: str
    email: str
    presupuesto_maximo: float
    zona_preferida: str
    habitaciones_minimas: int
    metros_minimos: int
    # Preferencias
    prefiere_ascensor: PreferenciaEnum = PreferenciaEnum.indiferente
    prefiere_garaje: PreferenciaEnum = PreferenciaEnum.indiferente
    prefiere_exterior: PreferenciaEnum = PreferenciaEnum.indiferente
    observaciones: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClienteSolicitudCreate(BaseModel):
    nombre: str
    telefono: str
    email: str
    presupuesto_maximo: float
    zona_preferida: str
    habitaciones_minimas: int
    metros_minimos: int
    prefiere_ascensor: PreferenciaEnum = PreferenciaEnum.indiferente
    prefiere_garaje: PreferenciaEnum = PreferenciaEnum.indiferente
    prefiere_exterior: PreferenciaEnum = PreferenciaEnum.indiferente
    observaciones: Optional[str] = ""

# Models para Coincidencias
class Coincidencia(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    id_piso: str
    id_cliente: str
    puntuacion_match: float
    detalles_match: dict
    fecha_match: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    activa: bool = True

# Función para calcular coincidencias
async def calcular_coincidencias(nuevo_piso=None, nuevo_cliente=None):
    coincidencias_encontradas = []
    
    if nuevo_piso:
        # Buscar clientes que coincidan con este piso
        clientes = await db.clientes.find().to_list(1000)
        for cliente_doc in clientes:
            cliente = ClienteSolicitud(**cliente_doc)
            match_score, detalles = evaluar_match_piso_cliente(nuevo_piso, cliente)
            if match_score > 0.6:  # Umbral de coincidencia
                coincidencia = Coincidencia(
                    id_piso=nuevo_piso.id,
                    id_cliente=cliente.id,
                    puntuacion_match=match_score,
                    detalles_match=detalles
                )
                await db.coincidencias.insert_one(coincidencia.dict())
                coincidencias_encontradas.append(coincidencia)
    
    if nuevo_cliente:
        # Buscar pisos que coincidan con este cliente
        pisos = await db.pisos.find().to_list(1000)
        for piso_doc in pisos:
            piso = Piso(**piso_doc)
            match_score, detalles = evaluar_match_piso_cliente(piso, nuevo_cliente)
            if match_score > 0.6:  # Umbral de coincidencia
                coincidencia = Coincidencia(
                    id_piso=piso.id,
                    id_cliente=nuevo_cliente.id,
                    puntuacion_match=match_score,
                    detalles_match=detalles
                )
                await db.coincidencias.insert_one(coincidencia.dict())
                coincidencias_encontradas.append(coincidencia)
    
    return coincidencias_encontradas

def evaluar_match_piso_cliente(piso: Piso, cliente: ClienteSolicitud):
    score = 0.0
    max_score = 5.0
    detalles = {}
    
    # 1. Precio (±10%)
    precio_min = cliente.presupuesto_maximo * 0.9
    precio_max = cliente.presupuesto_maximo * 1.1
    if precio_min <= piso.precio <= precio_max:
        score += 2.0
        detalles["precio"] = "✓ Dentro del presupuesto"
    else:
        detalles["precio"] = f"✗ Precio {piso.precio}€ fuera del presupuesto (max: {cliente.presupuesto_maximo}€)"
    
    # 2. Zona (coincidencia exacta)
    if piso.poblacion.lower() == cliente.zona_preferida.lower():
        score += 1.5
        detalles["zona"] = "✓ Zona coincidente"
    else:
        detalles["zona"] = f"✗ Zona no coincidente: {piso.poblacion} vs {cliente.zona_preferida}"
    
    # 3. Habitaciones (mínimo requerido)
    if piso.habitaciones >= cliente.habitaciones_minimas:
        score += 1.0
        detalles["habitaciones"] = f"✓ {piso.habitaciones} habitaciones (min: {cliente.habitaciones_minimas})"
    else:
        detalles["habitaciones"] = f"✗ {piso.habitaciones} habitaciones insuficientes (min: {cliente.habitaciones_minimas})"
    
    # 4. Metros (mínimo requerido)
    if piso.metros >= cliente.metros_minimos:
        score += 0.3
        detalles["metros"] = f"✓ {piso.metros}m² (min: {cliente.metros_minimos}m²)"
    else:
        detalles["metros"] = f"✗ {piso.metros}m² insuficientes (min: {cliente.metros_minimos}m²)"
    
    # 5. Preferencias (bonificaciones)
    if cliente.prefiere_ascensor == PreferenciaEnum.si and piso.ascensor:
        score += 0.1
        detalles["ascensor"] = "✓ Tiene ascensor (preferido)"
    elif cliente.prefiere_ascensor == PreferenciaEnum.no and not piso.ascensor:
        score += 0.1
        detalles["ascensor"] = "✓ Sin ascensor (preferido)"
    
    if cliente.prefiere_garaje == PreferenciaEnum.si and piso.garaje:
        score += 0.1
        detalles["garaje"] = "✓ Tiene garaje (preferido)"
    elif cliente.prefiere_garaje == PreferenciaEnum.no and not piso.garaje:
        score += 0.1
        detalles["garaje"] = "✓ Sin garaje (preferido)"
    
    percentage_score = (score / max_score)
    detalles["puntuacion_total"] = f"{percentage_score:.2%} ({score:.1f}/{max_score})"
    
    return percentage_score, detalles

# Routes para Pisos
@api_router.post("/pisos", response_model=Piso)
async def crear_piso(piso_data: PisoCreate):
    piso_dict = piso_data.dict()
    piso = Piso(**piso_dict)
    
    # Insertar piso
    result = await db.pisos.insert_one(piso.dict())
    
    # Buscar coincidencias automáticamente
    coincidencias = await calcular_coincidencias(nuevo_piso=piso)
    
    return piso

@api_router.get("/pisos", response_model=List[Piso])
async def obtener_pisos():
    pisos = await db.pisos.find().sort("created_at", -1).to_list(1000)
    return [Piso(**piso) for piso in pisos]

@api_router.delete("/pisos/{piso_id}")
async def eliminar_piso(piso_id: str):
    result = await db.pisos.delete_one({"id": piso_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Piso no encontrado")
    return {"message": "Piso eliminado"}

# Routes para Clientes/Solicitudes
@api_router.post("/clientes", response_model=ClienteSolicitud)
async def crear_cliente(cliente_data: ClienteSolicitudCreate):
    cliente_dict = cliente_data.dict()
    cliente = ClienteSolicitud(**cliente_dict)
    
    # Insertar cliente
    result = await db.clientes.insert_one(cliente.dict())
    
    # Buscar coincidencias automáticamente
    coincidencias = await calcular_coincidencias(nuevo_cliente=cliente)
    
    return cliente

@api_router.get("/clientes", response_model=List[ClienteSolicitud])
async def obtener_clientes():
    clientes = await db.clientes.find().sort("created_at", -1).to_list(1000)
    return [ClienteSolicitud(**cliente) for cliente in clientes]

@api_router.delete("/clientes/{cliente_id}")
async def eliminar_cliente(cliente_id: str):
    result = await db.clientes.delete_one({"id": cliente_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"message": "Cliente eliminado"}

# Routes para Coincidencias
@api_router.get("/coincidencias", response_model=List[dict])
async def obtener_coincidencias():
    coincidencias = await db.coincidencias.find({"activa": True}).sort("fecha_match", -1).to_list(1000)
    
    # Enriquecer con datos de piso y cliente
    resultado = []
    for coincidencia_doc in coincidencias:
        coincidencia = Coincidencia(**coincidencia_doc)
        
        # Obtener datos del piso
        piso_doc = await db.pisos.find_one({"id": coincidencia.id_piso})
        cliente_doc = await db.clientes.find_one({"id": coincidencia.id_cliente})
        
        if piso_doc and cliente_doc:
            resultado.append({
                "coincidencia": coincidencia.dict(),
                "piso": Piso(**piso_doc).dict(),
                "cliente": ClienteSolicitud(**cliente_doc).dict()
            })
    
    return resultado

@api_router.delete("/coincidencias/{coincidencia_id}")
async def desactivar_coincidencia(coincidencia_id: str):
    result = await db.coincidencias.update_one(
        {"id": coincidencia_id},
        {"$set": {"activa": False}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Coincidencia no encontrada")
    return {"message": "Coincidencia desactivada"}

# Ruta de estadísticas
@api_router.get("/stats")
async def obtener_estadisticas():
    total_pisos = await db.pisos.count_documents({})
    total_clientes = await db.clientes.count_documents({})
    total_coincidencias = await db.coincidencias.count_documents({"activa": True})
    
    return {
        "total_pisos": total_pisos,
        "total_clientes": total_clientes,
        "total_coincidencias": total_coincidencias
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()