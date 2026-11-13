import { isWellFormed, normalizeWord } from '@shared/domain/palabrero';

/**
 * Vocabulario de intentos válidos (servidor). Fase 1: lista base de demostración.
 * Fase 8: se reemplaza por un vocabulario español validado y licenciado + diccionario comunitario
 * administrado desde HQ (tabla word_dictionary_terms). Vive en el Worker, no en el bundle público.
 */
const BASE = `
abeja abril acero actor agosto agudo aguja ahora aire+ ajeno alado alamo album aldea alero algas almas altar altos alzar amada amigo ancho andar angel anima antes apodo arbol arena arroz asado atlas audaz avion ayuda azote
bahia baile bajar balas banco barco barra bocas bolsa bomba borde bravo brazo breve brisa broma bruja bueno burro buscar
cabra cajas calle calma calor cama+ campo canal canoa canto caoba carne carta casco casas causa caza+ cebra cerca cerdo cesta chico chile cielo cifra cinco circo claro clase clavo cobre coche colmo comer copas coral corte corto costa crema cruce cuero cueva
dados danza datos dedos dejar delta diana diario dicha dieta disco doble dolor drama dueño dulce durar
echar edad+ elote enano enero entra error espia estar etapa exito extra
fallo falta fango farol fauna favor fecha feliz feria fibra ficha fiera finca firma flaco flota fondo forma freno fresa frio+ fruta fuego fuera fuerte
gafas gallo ganar ganso garra gasto gente globo golpe gordo gorra grano grasa grito grupo guapo guiño gusto
habla hacer harto hecho helar hielo hogar hojas hongo honor horno hotel huevo humor
ideal igual islas
jaula jefes joven juego jugar junio junto justo
labio lapiz largo latas lavar leche lecho lejos lento letra libre libro lider limon linea listo llama llave lleno local loros lucha luces lugar
macho madre mango manos marco marea mayor media mejor menos mente mesas metal metro miedo mitad modo+ molde monte moral morir mosca motor mover mucho mundo museo
nacer nadar nariz naves negro nieve ninja noche norte notas novia nubes nuevo
obras ocaso odiar oeste oliva opera orden oreja oscuro otoño
padre pagar pajaro palma panel papel parar parte pasar paseo pasta patas patio pausa pecho pedir peine perla perro pesca piano pieza pinta pista plaga plano plata playa plaza plomo pluma pobre poder pollo posar prado premio prisa punto
queso quien quinta
radio rampa rango rapto rasgo razon recto regla reino reloj remar resto reyes rezar ricos riego risas ritmo robar rocas rodar rojos rollo rubio rueda ruido rumbo
sabor sacar salir salsa salto salud santo sapos selva señor siglo silla sitio sobre solar soplo suave subir sucio sudor suelo sueño suave surco
tabla tacos talla tanto tarde tarea techo tecla tela+ temor tenis tiempo tigre tinta tirar tocar todos tomar torre trago traje tramo trapo trato trece tribu trigo tropa truco tumba turno
ultimo unico untar usado
vacas vagos valle vapor vasos veces vela+ venta verde vidas vigor viaje vista viudo vivir volar votos
yerba yogur
zarpa zorro zumba
`;

/** Términos comunitarios/gamer aprobados (demo). En Fase 8 se gestionan desde HQ. */
const COMMUNITY = ['NERFS', 'BUFFS', 'TANKS', 'BARON', 'DRAKE', 'FLASH', 'LAGEO', 'TILTS', 'CARRY', 'FARMS', 'GANKS', 'PUSHS', 'RANKS'];

export const DICTIONARY: ReadonlySet<string> = new Set(
  [...BASE.split(/\s+/), ...COMMUNITY]
    .map((w) => normalizeWord(w.replace(/\+$/, '')))
    .filter((w) => isWellFormed(w)),
);
