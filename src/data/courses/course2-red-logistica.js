export const course2Data = {
  title: 'Red Logistica (Network)',
  description: 'Comprende el grafo global de Neo4j, tipos de nodos, relaciones, shipment journeys y configuracion de la red logistica.',
  order: 2,
  published: true,
  totalLessons: 5
};

export const course2Lessons = [
  // LESSON 1
  {
    title: 'Concepto de la Network',
    order: 1,
    content: `
<h2>Que es la Network?</h2>
<p>La Network es un <strong>unico grafo global</strong> almacenado en Neo4j que contiene los nodos de todas las organizaciones registradas en SyncFreight. No existe un grafo separado por organizacion: hay un solo grafo donde la propiedad <code>orgId</code> de cada nodo indica a que organizacion pertenece.</p>

<div class="callout">
<strong>Concepto clave:</strong> Cuando una organizacion consulta "su red", en realidad esta filtrando nodos del grafo global por su <code>orgId</code>. Todos los nodos coexisten en el mismo grafo, y las relaciones <code>GO</code> pueden cruzar entre organizaciones, formando una red interconectada.
</div>

<h2>Funciones Principales de la Network</h2>
<p>La Network cumple dos funciones fundamentales dentro de SyncFreight:</p>

<table>
<tr><th>Funcion</th><th>Descripcion</th><th>Ejemplo</th></tr>
<tr><td><strong>Ruteo</strong></td><td>Determina el camino que un envio debe seguir desde su punto de entrada hasta el codigo postal de destino. Este camino puede atravesar nodos de multiples organizaciones.</td><td>Un envio ingresa por el entry point de Org A, pasa por el warehouse de Org A, cruza a un nodo breach, y llega al operador de ultima milla de Org B para la entrega final.</td></tr>
<tr><td><strong>Gestion de Estados</strong></td><td>Define los flujos de estados (journeys) que un envio puede atravesar en cada nodo. Cada nodo tiene asociado un journey que determina las transiciones de estado validas.</td><td>Al llegar a un warehouse, el envio sigue el journey WHV1: recibido, procesado, despachado. Al llegar a un operador last-mile, sigue el journey LMV1: orden recibida, en ruta, entregado.</td></tr>
</table>

<h2>Filtrado del Grafo por Organizacion</h2>
<p>Cuando una organizacion necesita ver "su" red, el sistema ejecuta una consulta Cypher que filtra los nodos relevantes. El filtrado distingue entre nodos internos (de la propia organizacion) y nodos externos (de otras organizaciones vinculadas):</p>

<pre><code>WHERE (n.orgType = "internal" AND n.orgId = "OrgA")
   OR (n.orgType = "external" AND n.parentOrg = "OrgA")</code></pre>

<p>Este filtrado permite que cada organizacion vea sus propios nodos y los nodos externos que tiene configurados como parte de su red, sin exponer nodos de otras organizaciones que no le corresponden.</p>

<h2>Escenario: Broker + Vendor</h2>
<p>Un caso tipico de red inter-organizacional es el modelo <strong>Broker + Vendor</strong>:</p>
<ul>
<li><strong>Org A (Broker):</strong> Recibe paquetes de un shipper en su entry point, los procesa en su warehouse y los despacha.</li>
<li><strong>Org B (Vendor/Last Mile):</strong> Recibe los paquetes despachados por Org A y realiza la entrega final al destinatario.</li>
</ul>

<p>En este escenario, la ruta del envio cruza fronteras organizacionales. La consulta Cypher que calcula la ruta <strong>no filtra por orgId en los nodos intermedios</strong>, permitiendo que el camino atraviese nodos de distintas organizaciones de forma transparente.</p>

<div class="callout warning">
<strong>Importante:</strong> Aunque el grafo es global y las rutas pueden cruzar organizaciones, cada organizacion solo puede gestionar y modificar sus propios nodos. La visibilidad cruzada se limita a las relaciones GO configuradas entre organizaciones.
</div>

<h3>Flujo del envio en el modelo Broker + Vendor</h3>
<ul>
<li>El shipper inyecta el paquete en el entry point de Org A.</li>
<li>El paquete se procesa en el warehouse de Org A (journey WHV1).</li>
<li>El warehouse de Org A despacha el paquete hacia Org B a traves de una relacion GO inter-organizacional.</li>
<li>El paquete llega al nodo last-mile de Org B (journey LMV1).</li>
<li>Org B realiza la entrega final al codigo postal de destino.</li>
</ul>
`,
    test: {
      questions: [
        {
          id: 'c2l1q2',
          question: 'Cuales son las dos funciones principales de la Network?',
          options: [
            { id: 'a', text: 'Autenticacion de usuarios y almacenamiento de datos', explanation: 'La autenticacion y el almacenamiento de datos no son funciones de la Network. Estos son manejados por otros componentes del sistema.' },
            { id: 'b', text: 'Facturacion y gestion de inventario', explanation: 'La facturacion y gestion de inventario no son responsabilidades de la Network. La Network se enfoca en definir rutas y flujos de estados para los envios.' },
            { id: 'c', text: 'Ruteo de envios y gestion de estados (journeys)' },
            { id: 'd', text: 'Monitoreo de drivers y generacion de reportes', explanation: 'El monitoreo de drivers y los reportes no son funciones de la Network. Sus dos funciones son el ruteo de envios y la gestion de estados mediante journeys.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c2l1q3',
          question: 'Que propiedad de un nodo indica a que organizacion pertenece?',
          options: [
            { id: 'a', text: 'parentOrg', explanation: 'parentOrg solo se usa en nodos con orgType "external" para vincularlos con su organizacion padre. No es la propiedad general que indica pertenencia.' },
            { id: 'b', text: 'nodeType', explanation: 'nodeType indica el tipo de nodo (warehouse, lm, entryPoint, etc.), no la organizacion a la que pertenece.' },
            { id: 'c', text: 'orgId' },
            { id: 'd', text: 'name', explanation: 'name es el identificador corto o shortcode del nodo (ej: EWR-HUB), no indica a que organizacion pertenece.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c2l1q4',
          question: 'En el filtrado del grafo, que condicion se aplica a los nodos externos?',
          options: [
            { id: 'a', text: 'orgType = "external" AND orgId = "OrgA"', explanation: 'Para nodos externos se usa parentOrg, no orgId. El orgId de un nodo externo corresponde a la organizacion externa, no a la organizacion padre que consulta la red.' },
            { id: 'b', text: 'orgType = "external" AND parentOrg = "OrgA"' },
            { id: 'c', text: 'orgType = "internal" AND parentOrg = "OrgA"', explanation: 'Los nodos internos se filtran con orgType = "internal" AND orgId = "OrgA". La combinacion de orgType "internal" con parentOrg es incorrecta.' },
            { id: 'd', text: 'orgType = "vendor" AND orgId = "OrgA"', explanation: 'No existe un orgType "vendor". Los valores validos son "internal" y "external".' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c2l1q5',
          question: 'En el modelo Broker + Vendor, que ocurre cuando la ruta de un envio cruza entre organizaciones?',
          options: [
            { id: 'a', text: 'Se crea una copia del envio en la base de datos de la otra organizacion', explanation: 'No se crea una copia del envio al cruzar organizaciones. El algoritmo de ruteo simplemente atraviesa nodos de distintas organizaciones de forma transparente.' },
            { id: 'b', text: 'La consulta Cypher no filtra por orgId en los nodos intermedios, permitiendo rutas inter-organizacionales' },
            { id: 'c', text: 'El envio se detiene en la frontera y debe ser re-creado manualmente', explanation: 'El envio no se detiene ni necesita recrearse. Las relaciones GO inter-organizacionales permiten que el envio fluya automaticamente entre organizaciones.' },
            { id: 'd', text: 'Solo es posible si ambas organizaciones comparten la misma base de datos', explanation: 'No es necesario compartir base de datos. El grafo global en Neo4j permite que las rutas crucen fronteras organizacionales independientemente de las bases de datos.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c2l1q6',
          question: 'Que significa que las relaciones GO pueden cruzar entre organizaciones?',
          options: [
            { id: 'a', text: 'Que los envios solo pueden moverse dentro de una misma organizacion', explanation: 'Es lo contrario: las relaciones GO cross-org permiten que los envios se muevan entre organizaciones distintas, no solo dentro de una misma.' },
            { id: 'b', text: 'Que un nodo de Org A puede tener una relacion GO hacia un nodo de Org B, permitiendo que los envios fluyan entre organizaciones' },
            { id: 'c', text: 'Que las relaciones GO se duplican automaticamente en ambas organizaciones', explanation: 'Las relaciones GO no se duplican. Existe una unica relacion dirigida entre los nodos, independientemente de las organizaciones involucradas.' },
            { id: 'd', text: 'Que solo los nodos de tipo breach pueden conectar organizaciones distintas', explanation: 'Cualquier tipo de nodo puede tener relaciones GO cross-org, no solo los nodos breach. Por ejemplo, un warehouse puede conectarse directamente a un nodo lm de otra organizacion.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c2l1q7',
          question: 'Cuando una organizacion consulta "su red", que esta haciendo realmente el sistema?',
          options: [
            { id: 'a', text: 'Conectandose a una base de datos Neo4j exclusiva de esa organizacion', explanation: 'No existe una base de datos Neo4j exclusiva por organizacion. Todas comparten un unico grafo global que se filtra mediante consultas Cypher.' },
            { id: 'b', text: 'Descargando todo el grafo global y filtrandolo en el frontend', explanation: 'El filtrado no ocurre en el frontend. Se ejecuta una consulta Cypher en el servidor que filtra los nodos relevantes antes de enviarlos al cliente.' },
            { id: 'c', text: 'Filtrando nodos del grafo global por orgId (internos) y parentOrg (externos)' },
            { id: 'd', text: 'Ejecutando una copia del grafo en memoria para esa sesion', explanation: 'No se crea una copia del grafo en memoria. El sistema ejecuta consultas Cypher directamente sobre el grafo global, filtrando por orgId y parentOrg.' }
          ],
          correctOptionId: 'c'
        }
      ]
    }
  },

  // LESSON 2
  {
    title: 'Tipos de Nodos',
    order: 2,
    content: `
<h2>Los 5 Tipos de Nodos en la Network</h2>
<p>La Network de SyncFreight esta compuesta por <strong>5 tipos de nodos</strong> distintos, cada uno con un rol especifico dentro de la red logistica. El tipo de nodo determina su comportamiento, si tiene un journey de estados asociado, y como interactua con los envios que pasan por el.</p>

<table>
<tr><th>Tipo</th><th>Descripcion</th><th>Ejemplo</th><th>Journey</th></tr>
<tr><td><strong>entryPoint</strong></td><td>Punto de entrada de envios a la red</td><td>SYPHP, ORCH1</td><td>No tiene</td></tr>
<tr><td><strong>warehouse</strong></td><td>Centro de distribucion o sorting center</td><td>EWR, PHL</td><td>WHV1</td></tr>
<tr><td><strong>lm</strong> (Last Mile)</td><td>Operador de ultima milla</td><td>AGENA, AGENB</td><td>LMV1</td></tr>
<tr><td><strong>breach</strong></td><td>Punto de conexion intermedio para brokers</td><td>BREACH-INLAND</td><td>Solo estado in_transit</td></tr>
<tr><td><strong>postalcode</strong></td><td>Nodo de destino geografico</td><td>postalCode_07001</td><td>No tiene</td></tr>
</table>

<h2>entryPoint - Punto de Entrada</h2>
<p>El nodo <strong>entryPoint</strong> representa el lugar donde un shipper u organizacion externa inyecta carga en la red. Es el primer nodo que toca un envio al ingresar al sistema.</p>
<ul>
<li>Cada shipper tiene su propio entry point dedicado.</li>
<li><strong>No tiene journey asociado:</strong> los envios no cambian de estado en este nodo, simplemente ingresan a la red.</li>
<li>Desde el entry point, el envio se rutea hacia el siguiente nodo de la cadena (generalmente un warehouse).</li>
</ul>

<div class="callout">
<strong>Ejemplo:</strong> Un shipper llamado "ShipperX" tiene configurado el entry point <code>SYPHP</code>. Cada vez que ShipperX crea un envio, este ingresa a la red por el nodo SYPHP y desde alli se rutea segun el codigo postal de destino.
</div>

<h2>warehouse - Centro de Distribucion</h2>
<p>El nodo <strong>warehouse</strong> representa un centro de distribucion o sorting center. Es un punto intermedio critico donde los envios se reciben, procesan, consolidan y despachan hacia el siguiente destino.</p>
<ul>
<li>Son los hubs centrales de procesamiento de la red logistica.</li>
<li><strong>Journey asociado: WHV1</strong> (Warehouse Version 1), que define los estados por los que pasa un envio dentro del warehouse.</li>
<li>Un warehouse puede recibir envios de multiples entry points y despacharlos hacia distintos operadores de ultima milla.</li>
</ul>

<h3>Operaciones tipicas en un warehouse</h3>
<ul>
<li>Recepcion e ingreso (scanning de paquetes)</li>
<li>Clasificacion y sorting por zona de destino</li>
<li>Consolidacion en pallets o manifiestos</li>
<li>Despacho hacia el siguiente nodo de la ruta</li>
</ul>

<h2>lm (Last Mile) - Operador de Ultima Milla</h2>
<p>El nodo <strong>lm</strong> representa al operador encargado de la entrega final al destinatario. Estos son agentes o flotas de entrega que cubren zonas geograficas especificas.</p>
<ul>
<li>Cada operador de ultima milla cubre un conjunto de codigos postales.</li>
<li><strong>Journey asociado: LMV1</strong> (Last Mile Version 1), que define los estados desde la recepcion de la orden hasta la entrega o fallo.</li>
<li>Pueden ser agentes propios de la organizacion o vendors externos.</li>
</ul>

<h2>breach - Punto de Conexion Intermedio</h2>
<p>El nodo <strong>breach</strong> es un punto de conexion utilizado principalmente por brokers. No realiza ningun procesamiento sobre los envios; su funcion es indicar que el envio esta en transito entre dos puntos de la red.</p>
<ul>
<li>Tipicamente usado cuando un broker actua como intermediario entre un warehouse y un operador de ultima milla.</li>
<li><strong>Journey minimo:</strong> solo maneja el estado <code>in_transit</code>, indicando que el paquete esta en camino.</li>
<li>Permite que el broker tenga visibilidad del envio mientras transita entre nodos de distintas organizaciones.</li>
</ul>

<div class="callout warning">
<strong>Atencion:</strong> Un nodo breach no procesa envios ni cambia su contenido. Es puramente un nodo de paso que proporciona trazabilidad en el tramo entre organizaciones.
</div>

<h2>postalcode - Nodo de Destino Geografico</h2>
<p>El nodo <strong>postalcode</strong> representa un codigo postal o rango de codigos postales. Es el destino final utilizado para calcular las rutas de envio.</p>
<ul>
<li>El nombre del nodo sigue el formato <code>postalCode_XXXXX</code> (ejemplo: <code>postalCode_07001</code>).</li>
<li><strong>No tiene journey asociado:</strong> es un nodo terminal que solo sirve como destino para el algoritmo de ruteo.</li>
<li>Cuando se crea un envio, el sistema busca la ruta desde el entry point del shipper hasta el nodo postalcode correspondiente al codigo postal de destino.</li>
</ul>

<h2>Resumen de Journeys por Tipo de Nodo</h2>
<table>
<tr><th>Tipo de Nodo</th><th>Tiene Journey</th><th>Journey Code</th><th>Razon</th></tr>
<tr><td>entryPoint</td><td>No</td><td>-</td><td>Solo es un punto de ingreso, no procesa envios</td></tr>
<tr><td>warehouse</td><td>Si</td><td>WHV1</td><td>Necesita gestionar estados de recepcion, procesamiento y despacho</td></tr>
<tr><td>lm</td><td>Si</td><td>LMV1</td><td>Necesita gestionar estados desde recepcion hasta entrega final</td></tr>
<tr><td>breach</td><td>Parcial</td><td>-</td><td>Solo maneja estado in_transit como punto de paso</td></tr>
<tr><td>postalcode</td><td>No</td><td>-</td><td>Es un nodo destino, no procesa envios</td></tr>
</table>
`,
    test: {
      questions: [
        {
          id: 'c2l2q1',
          question: 'Cuantos tipos de nodos existen en la Network de SyncFreight?',
          options: [
            { id: 'a', text: '3 tipos: warehouse, last-mile y postalcode', explanation: 'Faltan dos tipos de nodo: entryPoint (punto de entrada) y breach (punto de conexion intermedio). La Network tiene 5 tipos en total.' },
            { id: 'b', text: '5 tipos: entryPoint, warehouse, lm, breach y postalcode' },
            { id: 'c', text: '4 tipos: entryPoint, warehouse, lm y postalcode', explanation: 'Falta el tipo breach, que es el punto de conexion intermedio usado por brokers. La Network tiene 5 tipos en total.' },
            { id: 'd', text: '6 tipos: entryPoint, warehouse, lm, breach, postalcode y hub', explanation: 'No existe un tipo de nodo "hub" en la Network. Los 5 tipos validos son entryPoint, warehouse, lm, breach y postalcode.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c2l2q2',
          question: 'Que funcion cumple un nodo de tipo entryPoint?',
          options: [
            { id: 'a', text: 'Procesa y clasifica los envios por zona de destino', explanation: 'Procesar y clasificar envios es la funcion del nodo warehouse. El entryPoint solo sirve como punto de ingreso a la red.' },
            { id: 'b', text: 'Es el punto donde un shipper inyecta carga en la red' },
            { id: 'c', text: 'Realiza la entrega final al destinatario', explanation: 'La entrega final es responsabilidad del nodo lm (last mile). El entryPoint es el primer nodo de la cadena, no el ultimo.' },
            { id: 'd', text: 'Conecta organizaciones como punto intermedio de transito', explanation: 'Conectar organizaciones como punto intermedio es la funcion del nodo breach. El entryPoint es el punto de ingreso de carga a la red.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c2l2q3',
          question: 'Que journey tiene asociado un nodo de tipo warehouse?',
          options: [
            { id: 'a', text: 'LMV1', explanation: 'LMV1 (Last Mile Version 1) es el journey asociado a nodos de ultima milla (lm), no a warehouses.' },
            { id: 'b', text: 'No tiene journey asociado', explanation: 'Los warehouses si tienen journey asociado. Los nodos sin journey son entryPoint y postalcode.' },
            { id: 'c', text: 'WHV1' },
            { id: 'd', text: 'Solo el estado in_transit', explanation: 'El estado in_transit como unico estado es caracteristico del nodo breach, no del warehouse. El warehouse tiene un journey completo (WHV1) con multiples estados.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c2l2q4',
          question: 'Cual es la caracteristica principal de un nodo breach?',
          options: [
            { id: 'a', text: 'Almacena paquetes temporalmente antes de la entrega final', explanation: 'El nodo breach no almacena paquetes. Es puramente un punto de paso que proporciona trazabilidad con el estado in_transit.' },
            { id: 'b', text: 'No realiza procesamiento, solo indica que el envio esta en transito entre puntos de la red' },
            { id: 'c', text: 'Es el unico nodo que puede conectar organizaciones distintas', explanation: 'No es el unico nodo que conecta organizaciones. Cualquier nodo puede tener relaciones GO cross-org hacia nodos de otras organizaciones.' },
            { id: 'd', text: 'Gestiona la facturacion entre organizaciones', explanation: 'El nodo breach no gestiona facturacion. Su unica funcion es servir como punto de paso con el estado in_transit para dar trazabilidad entre organizaciones.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c2l2q5',
          question: 'Que formato sigue el nombre de un nodo postalcode?',
          options: [
            { id: 'a', text: 'zip_XXXXX', explanation: 'El prefijo "zip_" no es el formato correcto. El formato real usa "postalCode_" seguido del codigo postal.' },
            { id: 'b', text: 'PC-XXXXX', explanation: 'El formato "PC-XXXXX" con guion no es correcto. El formato real usa "postalCode_" con guion bajo seguido del codigo postal.' },
            { id: 'c', text: 'postalCode_XXXXX' },
            { id: 'd', text: 'destino_XXXXX', explanation: 'El prefijo "destino_" no existe en el sistema. El formato correcto es "postalCode_" seguido del numero de codigo postal.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c2l2q6',
          question: 'Que tipos de nodo NO tienen journey asociado?',
          options: [
            { id: 'a', text: 'warehouse y lm', explanation: 'Warehouse y lm si tienen journeys asociados: WHV1 y LMV1 respectivamente. Son los nodos que procesan envios y necesitan gestion de estados.' },
            { id: 'b', text: 'entryPoint y postalcode' },
            { id: 'c', text: 'breach y lm', explanation: 'El nodo lm si tiene journey asociado (LMV1). Ademas, breach tiene un journey minimo con el estado in_transit, aunque no es un journey completo.' },
            { id: 'd', text: 'Solo postalcode', explanation: 'Ademas de postalcode, el nodo entryPoint tampoco tiene journey asociado. Ambos son nodos que no procesan envios: uno es punto de ingreso y el otro es destino.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c2l2q8',
          question: 'Que relacion tiene un shipper con los nodos entryPoint?',
          options: [
            { id: 'a', text: 'Un shipper puede usar cualquier entry point de cualquier organizacion', explanation: 'Un shipper no puede usar cualquier entry point. Cada shipper tiene asignado su propio entry point dedicado por donde inyecta su carga.' },
            { id: 'b', text: 'Cada shipper tiene su propio entry point dedicado' },
            { id: 'c', text: 'Los shippers no interactuan con entry points, inyectan carga directamente en warehouses', explanation: 'Los shippers siempre inyectan carga a traves de su entry point dedicado. No pueden enviar directamente a warehouses sin pasar por un entry point.' },
            { id: 'd', text: 'Todos los shippers de una organizacion comparten un unico entry point', explanation: 'Los shippers no comparten un unico entry point. Cada shipper tiene su propio entry point dedicado para inyectar carga en la red.' }
          ],
          correctOptionId: 'b'
        }
      ]
    }
  },

  // LESSON 3
  {
    title: 'Propiedades y Relaciones',
    order: 3,
    content: `
<h2>Propiedades de los Nodos</h2>
<p>Cada nodo en la Network tiene un conjunto de propiedades que definen su identidad, comportamiento y configuracion dentro del grafo. Estas propiedades se almacenan directamente en el nodo de Neo4j.</p>

<table>
<tr><th>Propiedad</th><th>Descripcion</th><th>Ejemplo</th></tr>
<tr><td><strong>name</strong></td><td>Identificador unico dentro de la organizacion (shortcode). Sirve como referencia rapida para el nodo.</td><td><code>EWR-HUB</code></td></tr>
<tr><td><strong>orgId</strong></td><td>ID de la organizacion duena del nodo. Permite filtrar el grafo global por organizacion.</td><td><code>org_abc123</code></td></tr>
<tr><td><strong>nodeType</strong></td><td>Tipo de nodo que determina su comportamiento en la red.</td><td><code>warehouse</code>, <code>lm</code>, <code>entryPoint</code></td></tr>
<tr><td><strong>orgType</strong></td><td>Indica si la organizacion duena del nodo es interna (tiene cuenta en SyncFreight) o externa (no tiene cuenta).</td><td><code>internal</code> o <code>external</code></td></tr>
<tr><td><strong>journeyCode</strong></td><td>Codigo del flujo de estados que se aplica a los envios al llegar a este nodo.</td><td><code>LMV1</code>, <code>WHV1</code></td></tr>
<tr><td><strong>shipmentJourneyInitialState</strong></td><td>Estado inicial que recibe el envio al entrar a este nodo. Es el punto de partida del journey asociado.</td><td><code>LMV1-OR</code> (Order Received)</td></tr>
<tr><td><strong>parentOrg</strong></td><td>ID de la organizacion padre. Solo aplica para nodos con <code>orgType = external</code>.</td><td><code>org_parent456</code></td></tr>
<tr><td><strong>defaultLocation</strong></td><td>Direccion fisica del nodo, almacenada en formato URL-encoded.</td><td><code>123%20Main%20St%2C%20Newark%2C%20NJ</code></td></tr>
<tr><td><strong>color</strong></td><td>Color asignado al nodo para su representacion visual en la interfaz.</td><td><code>#FF5733</code></td></tr>
</table>

<h3>Propiedad orgType: internal vs external</h3>
<p>La propiedad <code>orgType</code> es fundamental para entender la visibilidad de los nodos en el grafo:</p>
<ul>
<li><strong>internal:</strong> La organizacion duena del nodo tiene una cuenta activa en SyncFreight. El nodo se filtra directamente por <code>orgId</code>.</li>
<li><strong>external:</strong> La organizacion duena del nodo NO tiene cuenta en SyncFreight. El nodo se vincula a una organizacion padre a traves de <code>parentOrg</code> y se filtra por este campo.</li>
</ul>

<div class="callout">
<strong>Ejemplo:</strong> Una organizacion broker (Org A) trabaja con un agente de ultima milla que no tiene cuenta en SyncFreight. El nodo del agente tendria <code>orgType = "external"</code> y <code>parentOrg = "OrgA"</code>. Cuando Org A consulta su red, este nodo aparece gracias al filtro por <code>parentOrg</code>.
</div>

<h2>Propiedad shipmentJourneyInitialState</h2>
<p>Esta propiedad define el <strong>estado inicial</strong> que un envio recibe automaticamente al llegar a un nodo. El formato tipicamente combina el codigo del journey con un sufijo que identifica el estado:</p>
<ul>
<li><code>LMV1-OR</code>: Journey LMV1, estado Order Received</li>
<li><code>WHV1-RC</code>: Journey WHV1, estado Received</li>
</ul>
<p>Cuando un envio avanza en la red y llega a un nuevo nodo, el sistema automaticamente le asigna el <code>shipmentJourneyInitialState</code> de ese nodo, iniciando el flujo de estados correspondiente.</p>

<h2>Relaciones entre Nodos</h2>
<p>Los nodos de la Network se conectan mediante <strong>relaciones dirigidas de tipo GO</strong>. Una relacion <code>(Nodo A) -[:GO]-> (Nodo B)</code> indica que un envio puede fluir desde el Nodo A hacia el Nodo B.</p>

<h3>Caracteristicas de las relaciones GO</h3>
<ul>
<li><strong>Son dirigidas:</strong> El sentido de la flecha indica la direccion del flujo. Si existe <code>A -[:GO]-> B</code>, los envios pueden ir de A a B pero no de B a A (salvo que exista otra relacion en sentido contrario).</li>
<li><strong>Pueden ser intra-organizacion:</strong> Conectan dos nodos de la misma organizacion (<code>orgId</code> identico).</li>
<li><strong>Pueden ser inter-organizacion (cross-org):</strong> Conectan nodos de organizaciones diferentes, permitiendo que los envios crucen fronteras organizacionales.</li>
<li><strong>Un nodo puede tener multiples relaciones:</strong> Tanto de entrada como de salida. Un warehouse puede recibir envios de varios entry points y despachar hacia multiples operadores de ultima milla.</li>
</ul>

<h3>Ejemplo de relaciones en una red tipica</h3>
<pre><code>(entryPoint: SYPHP) -[:GO]-> (warehouse: EWR)
(entryPoint: ORCH1) -[:GO]-> (warehouse: EWR)
(warehouse: EWR) -[:GO]-> (lm: AGENA)
(warehouse: EWR) -[:GO]-> (lm: AGENB)
(lm: AGENA) -[:GO]-> (postalcode: postalCode_07001)
(lm: AGENA) -[:GO]-> (postalcode: postalCode_07002)
(lm: AGENB) -[:GO]-> (postalcode: postalCode_08001)</code></pre>

<p>En este ejemplo, el warehouse EWR recibe envios de dos entry points distintos y puede despachar hacia dos operadores de ultima milla. Cada operador cubre un conjunto diferente de codigos postales.</p>

<div class="callout warning">
<strong>Importante:</strong> Las relaciones GO son el unico mecanismo que define por donde pueden circular los envios. Si no existe una relacion GO entre dos nodos, ningun envio puede fluir entre ellos, incluso si ambos pertenecen a la misma organizacion.
</div>

<h2>Relaciones Cross-Org</h2>
<p>Las relaciones inter-organizacionales son fundamentales para el modelo de negocio de SyncFreight, ya que permiten que operadores logisticos independientes colaboren en la cadena de entrega:</p>
<ul>
<li>Un warehouse de Org A puede tener una relacion GO hacia un nodo lm de Org B.</li>
<li>El algoritmo de ruteo atraviesa estas relaciones sin restriccion por organizacion.</li>
<li>La replicacion de estados se activa automaticamente cuando un envio cruza una frontera organizacional.</li>
</ul>
`,
    test: {
      questions: [
        {
          id: 'c2l3q1',
          question: 'Que representa la propiedad "name" de un nodo?',
          options: [
            { id: 'a', text: 'El nombre completo de la organizacion duena del nodo', explanation: 'La propiedad "name" identifica al nodo, no a la organizacion. Para identificar la organizacion se usa orgId.' },
            { id: 'b', text: 'Un identificador unico dentro de la organizacion (shortcode)' },
            { id: 'c', text: 'El tipo de nodo en formato legible', explanation: 'El tipo de nodo se almacena en la propiedad nodeType, no en name. La propiedad name es un shortcode como EWR-HUB.' },
            { id: 'd', text: 'La direccion fisica del nodo', explanation: 'La direccion fisica se almacena en la propiedad defaultLocation en formato URL-encoded, no en name.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c2l3q2',
          question: 'Cual es la diferencia entre orgType "internal" y "external"?',
          options: [
            { id: 'a', text: 'Internal significa nodos dentro del pais, external significa nodos internacionales', explanation: 'orgType no tiene relacion con la ubicacion geografica. Se refiere a si la organizacion duena del nodo tiene o no cuenta en SyncFreight.' },
            { id: 'b', text: 'Internal indica que la organizacion tiene cuenta en SyncFreight, external indica que no la tiene' },
            { id: 'c', text: 'Internal es para warehouses y external es para operadores de ultima milla', explanation: 'orgType no depende del tipo de nodo. Cualquier tipo de nodo puede ser internal o external segun si su organizacion tiene cuenta en SyncFreight.' },
            { id: 'd', text: 'No hay diferencia funcional, es solo una etiqueta informativa', explanation: 'Si hay diferencia funcional importante. Los nodos internal se filtran por orgId, mientras que los external se filtran por parentOrg, lo cual afecta la visibilidad en el grafo.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c2l3q3',
          question: 'Que indica una relacion GO entre dos nodos?',
          options: [
            { id: 'a', text: 'Que ambos nodos pertenecen a la misma organizacion', explanation: 'Una relacion GO no implica que los nodos pertenezcan a la misma organizacion. Las relaciones GO pueden ser cross-org, conectando nodos de diferentes organizaciones.' },
            { id: 'b', text: 'Que un envio puede fluir desde el nodo origen hacia el nodo destino' },
            { id: 'c', text: 'Que los dos nodos comparten el mismo journey de estados', explanation: 'Cada nodo tiene su propio journey independiente de las relaciones GO. Una relacion GO solo indica la posibilidad de flujo de envios, no similitud de journeys.' },
            { id: 'd', text: 'Que existe una ruta de transporte fisico entre ambos nodos', explanation: 'La relacion GO es una conexion logica en el grafo, no representa una ruta de transporte fisico directo. Define por donde pueden circular los envios en la red.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c2l3q4',
          question: 'Para que sirve la propiedad shipmentJourneyInitialState?',
          options: [
            { id: 'a', text: 'Define el estado final que debe tener un envio al salir del nodo', explanation: 'No define el estado final. Define el estado inicial de entrada al nodo. Los estados finales los determinan los estados terminales del journey.' },
            { id: 'b', text: 'Indica el estado inicial que un envio recibe automaticamente al llegar al nodo' },
            { id: 'c', text: 'Almacena el historial completo de estados del envio', explanation: 'Esta propiedad no almacena historial. Solo define un unico estado inicial que se asigna automaticamente cuando un envio llega al nodo.' },
            { id: 'd', text: 'Define que tipo de nodo puede recibir envios desde este nodo', explanation: 'Los nodos que pueden recibir envios se determinan por las relaciones GO, no por shipmentJourneyInitialState. Esta propiedad solo define el estado de entrada.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c2l3q5',
          question: 'Que propiedad se usa para vincular un nodo externo con su organizacion padre?',
          options: [
            { id: 'a', text: 'orgId', explanation: 'orgId identifica a la organizacion duena del nodo. Para nodos externos, se necesita parentOrg para vincularlos con la organizacion padre que los gestiona.' },
            { id: 'b', text: 'nodeType', explanation: 'nodeType define el tipo de nodo (warehouse, lm, etc.), no tiene relacion con la vinculacion organizacional de nodos externos.' },
            { id: 'c', text: 'parentOrg' },
            { id: 'd', text: 'journeyCode', explanation: 'journeyCode define el flujo de estados que se aplica a los envios en el nodo. No tiene relacion con la vinculacion de nodos externos a organizaciones padre.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c2l3q6',
          question: 'Las relaciones GO entre nodos son:',
          options: [
            { id: 'a', text: 'Bidireccionales: si A conecta a B, automaticamente B conecta a A', explanation: 'Las relaciones GO son dirigidas, no bidireccionales. Si A conecta a B, los envios solo fluyen de A a B. Para el flujo inverso se necesita otra relacion GO explicita.' },
            { id: 'b', text: 'Dirigidas: indican la direccion del flujo de envios y pueden ser intra-org o cross-org' },
            { id: 'c', text: 'Solo pueden existir entre nodos de la misma organizacion', explanation: 'Las relaciones GO pueden ser tanto intra-organizacion como inter-organizacion (cross-org), permitiendo que envios crucen fronteras organizacionales.' },
            { id: 'd', text: 'Se crean automaticamente entre todos los nodos del mismo tipo', explanation: 'Las relaciones GO no se crean automaticamente. Deben configurarse manualmente para definir las rutas posibles de circulacion de envios en la red.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c2l3q7',
          question: 'En que formato se almacena la propiedad defaultLocation?',
          options: [
            { id: 'a', text: 'Coordenadas GPS (latitud, longitud)', explanation: 'defaultLocation no almacena coordenadas GPS. Se almacena como una direccion en formato URL-encoded (ej: 123%20Main%20St%2C%20Newark%2C%20NJ).' },
            { id: 'b', text: 'Codigo postal del nodo', explanation: 'defaultLocation almacena la direccion fisica completa, no solo un codigo postal. Los codigos postales se representan como nodos postalcode separados.' },
            { id: 'c', text: 'Formato URL-encoded' },
            { id: 'd', text: 'JSON con calle, ciudad, estado y pais', explanation: 'La direccion no se almacena como un objeto JSON estructurado sino como una cadena de texto en formato URL-encoded.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c2l3q8',
          question: 'Que sucede si no existe una relacion GO entre dos nodos?',
          options: [
            { id: 'a', text: 'El sistema crea una relacion temporal para ese envio', explanation: 'El sistema no crea relaciones temporales. Las relaciones GO deben existir previamente en el grafo para que los envios puedan circular.' },
            { id: 'b', text: 'Ningun envio puede fluir entre ellos, incluso si pertenecen a la misma organizacion' },
            { id: 'c', text: 'Los envios pueden fluir pero con un costo adicional', explanation: 'Sin relacion GO, el flujo de envios esta completamente bloqueado. No existe un mecanismo alternativo con costo adicional para sortear la falta de relacion.' },
            { id: 'd', text: 'Solo los administradores pueden mover envios manualmente entre esos nodos', explanation: 'Ningun rol puede mover envios entre nodos sin relacion GO. Las relaciones GO son el unico mecanismo que define las rutas posibles de circulacion.' }
          ],
          correctOptionId: 'b'
        }
      ]
    }
  },

  // LESSON 4
  {
    title: 'Shipment Journeys',
    order: 4,
    content: `
<h2>Que son los Shipment Journeys?</h2>
<p>Los Shipment Journeys son un <strong>segundo tipo de grafo en Neo4j</strong> que define las transiciones de estado validas para los envios. Mientras que la Network define por donde pueden circular los envios (ruteo fisico), los journeys definen <strong>como cambian de estado</strong> los envios en cada punto de la red.</p>

<div class="callout">
<strong>Concepto clave:</strong> Un journey es un grafo dirigido aciclico (DAG) de nodos de estado conectados por relaciones <code>NEXT</code>. Cada nodo de la Network que procesa envios tiene asociado un <code>journeyCode</code> que determina que journey se aplica a los envios que llegan a ese nodo.
</div>

<h2>Estructura de un Nodo de Estado</h2>
<p>Cada nodo de estado dentro de un journey tiene las siguientes propiedades:</p>

<table>
<tr><th>Propiedad</th><th>Descripcion</th><th>Ejemplo</th></tr>
<tr><td><strong>name</strong></td><td>Nombre descriptivo del estado en formato legible</td><td><code>order_received</code>, <code>out_for_delivery</code></td></tr>
<tr><td><strong>code</strong></td><td>Codigo corto unico que identifica el estado dentro del journey</td><td><code>LMV1-OR</code>, <code>LMV1-OF</code></td></tr>
<tr><td><strong>journeyCode</strong></td><td>Codigo del journey al que pertenece este nodo de estado</td><td><code>LMV1</code>, <code>WHV1</code></td></tr>
<tr><td><strong>initial</strong></td><td>Booleano que indica si es el estado inicial del journey</td><td><code>true</code> o <code>false</code></td></tr>
<tr><td><strong>terminal</strong></td><td>Booleano que indica si es un estado final (no tiene transiciones de salida)</td><td><code>true</code> o <code>false</code></td></tr>
</table>

<h3>Formato del codigo de estado</h3>
<p>El codigo de estado sigue el patron <code>[JourneyCode]-[Sufijo]</code>, donde el sufijo es una abreviatura del nombre del estado:</p>
<ul>
<li><code>LMV1-OR</code>: Journey LMV1, estado Order Received</li>
<li><code>LMV1-OF</code>: Journey LMV1, estado Out for Delivery</li>
<li><code>LMV1-DE</code>: Journey LMV1, estado Delivered</li>
<li><code>LMV1-FD</code>: Journey LMV1, estado Failed Delivery</li>
</ul>

<h2>Relaciones NEXT</h2>
<p>Los nodos de estado se conectan mediante relaciones de tipo <strong>NEXT</strong> (no GO, que es exclusiva de la Network de nodos fisicos). Una relacion <code>NEXT</code> indica que un envio puede transicionar de un estado a otro.</p>

<ul>
<li>Las relaciones NEXT son <strong>dirigidas</strong>: definen el sentido valido de la transicion.</li>
<li>Forman un <strong>DAG (Grafo Dirigido Aciclico)</strong> en la mayoria de los casos, aunque pueden existir ciclos controlados (como reintentos de entrega).</li>
<li>Un estado puede tener multiples relaciones NEXT de salida, ofreciendo diferentes caminos segun el resultado de la operacion.</li>
</ul>

<h2>Estados Iniciales y Terminales</h2>

<h3>Estado Inicial</h3>
<p>Cada journey tiene exactamente <strong>un estado inicial</strong> (propiedad <code>initial = true</code>). Cuando un envio llega a un nodo de la Network, se le asigna automaticamente el estado inicial del journey asociado a ese nodo (definido por <code>shipmentJourneyInitialState</code>).</p>

<h3>Estados Terminales</h3>
<p>Los estados terminales (propiedad <code>terminal = true</code>) son estados finales que no tienen transiciones de salida. Una vez que un envio alcanza un estado terminal, no puede avanzar mas dentro de ese journey. Ejemplos de estados terminales:</p>
<ul>
<li><strong>delivered:</strong> El envio fue entregado exitosamente al destinatario.</li>
<li><strong>lost:</strong> El envio se perdio y no puede ser recuperado.</li>
<li><strong>not_delivered:</strong> El envio no pudo ser entregado despues de agotar los intentos.</li>
</ul>

<h2>Ejemplo: Journey LMV1 (Last Mile Version 1)</h2>
<p>El journey LMV1 es el flujo de estados para operadores de ultima milla. Define las transiciones validas desde la recepcion de la orden hasta la entrega final o fallo:</p>

<h3>Diagrama de transiciones</h3>
<pre><code>order_received --> out_for_delivery --> delivered
out_for_delivery --> failed_delivery --> not_delivered
failed_delivery --> out_for_delivery</code></pre>

<h3>Detalle de estados LMV1</h3>
<table>
<tr><th>Codigo</th><th>Nombre</th><th>Inicial</th><th>Terminal</th><th>Descripcion</th></tr>
<tr><td><code>LMV1-OR</code></td><td>order_received</td><td>Si</td><td>No</td><td>El envio fue recibido por el operador de ultima milla</td></tr>
<tr><td><code>LMV1-OF</code></td><td>out_for_delivery</td><td>No</td><td>No</td><td>El envio esta en ruta hacia el destinatario</td></tr>
<tr><td><code>LMV1-DE</code></td><td>delivered</td><td>No</td><td>Si</td><td>El envio fue entregado exitosamente</td></tr>
<tr><td><code>LMV1-FD</code></td><td>failed_delivery</td><td>No</td><td>No</td><td>El intento de entrega fallo (destinatario ausente, direccion incorrecta, etc.)</td></tr>
<tr><td><code>LMV1-ND</code></td><td>not_delivered</td><td>No</td><td>Si</td><td>El envio no pudo ser entregado tras agotar los intentos</td></tr>
</table>

<h3>Flujos posibles en LMV1</h3>
<ul>
<li><strong>Entrega exitosa:</strong> OR -> OF -> DE</li>
<li><strong>Fallo sin reintento:</strong> OR -> OF -> FD -> ND</li>
<li><strong>Fallo con reintento exitoso:</strong> OR -> OF -> FD -> OF -> DE</li>
<li><strong>Multiples reintentos:</strong> OR -> OF -> FD -> OF -> FD -> OF -> DE (o ND)</li>
</ul>

<div class="callout">
<strong>Nota sobre reintentos:</strong> La transicion <code>FD -> OF</code> permite reintentar la entrega despues de un fallo. Este es uno de los pocos casos donde el journey permite un "ciclo" controlado. El sistema puede limitar la cantidad de reintentos segun la configuracion del nodo.
</div>

<div class="callout warning">
<strong>Validacion de transiciones:</strong> El sistema valida que cada cambio de estado sea una transicion NEXT valida dentro del journey. No es posible saltar estados ni retroceder a estados que no tengan una relacion NEXT de vuelta. Por ejemplo, no se puede pasar directamente de OR a DE sin pasar por OF.
</div>
`,
    test: {
      questions: [
        {
          id: 'c2l4q1',
          question: 'Que tipo de relacion conecta los nodos de estado dentro de un journey?',
          options: [
            { id: 'a', text: 'GO, la misma que conecta nodos de la Network', explanation: 'Las relaciones GO son exclusivas de la Network de nodos fisicos. Dentro de un journey, las transiciones de estado se definen con relaciones NEXT.' },
            { id: 'b', text: 'NEXT, relaciones dirigidas que definen transiciones de estado validas' },
            { id: 'c', text: 'FLOW, relaciones bidireccionales entre estados', explanation: 'No existe un tipo de relacion "FLOW" en el sistema. Ademas, las relaciones de transicion son dirigidas, no bidireccionales.' },
            { id: 'd', text: 'STATUS, relaciones que se crean dinamicamente por envio', explanation: 'No existe un tipo de relacion "STATUS" ni se crean relaciones dinamicamente por envio. Las relaciones NEXT son estaticas y definen las transiciones validas del journey.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c2l4q2',
          question: 'Que propiedad de un nodo de estado indica que es un estado final?',
          options: [
            { id: 'a', text: 'initial = true', explanation: 'initial = true marca el estado de entrada del journey, no el final. Es el primer estado que recibe un envio al llegar al nodo.' },
            { id: 'b', text: 'final = true', explanation: 'No existe una propiedad llamada "final" en los nodos de estado. La propiedad correcta para identificar estados finales es "terminal".' },
            { id: 'c', text: 'terminal = true' },
            { id: 'd', text: 'completed = true', explanation: 'No existe una propiedad llamada "completed" en los nodos de estado. La propiedad que indica un estado final sin transiciones de salida es "terminal".' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c2l4q3',
          question: 'En el journey LMV1, cual es el estado inicial?',
          options: [
            { id: 'a', text: 'out_for_delivery (OF)', explanation: 'out_for_delivery es el segundo estado del journey LMV1, no el inicial. Antes de salir a ruta, el envio debe pasar primero por order_received.' },
            { id: 'b', text: 'order_received (OR)' },
            { id: 'c', text: 'delivered (DE)', explanation: 'delivered es un estado terminal del journey LMV1, el resultado exitoso de la entrega. El estado inicial es order_received.' },
            { id: 'd', text: 'in_transit (IT)', explanation: 'in_transit es un estado del nodo breach, no del journey LMV1. El journey de ultima milla comienza con order_received.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c2l4q4',
          question: 'Cuales son los estados terminales del journey LMV1?',
          options: [
            { id: 'a', text: 'delivered y out_for_delivery', explanation: 'out_for_delivery no es un estado terminal. Es un estado intermedio desde el cual el envio puede avanzar a delivered o failed_delivery.' },
            { id: 'b', text: 'Solo delivered', explanation: 'Delivered no es el unico estado terminal. Tambien son terminales lost y not_delivered, que representan los escenarios donde el envio no puede ser entregado.' },
            { id: 'c', text: 'delivered, lost y not_delivered' },
            { id: 'd', text: 'failed_delivery y not_delivered', explanation: 'failed_delivery no es un estado terminal porque tiene una transicion NEXT de vuelta a out_for_delivery para permitir reintentos de entrega. Ademas, falta delivered como terminal.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c2l4q5',
          question: 'Que formato sigue el codigo de un nodo de estado?',
          options: [
            { id: 'a', text: '[NombreEstado]_[Version]', explanation: 'El formato no usa el nombre del estado como prefijo. El patron correcto comienza con el codigo del journey seguido de un guion y un sufijo abreviado.' },
            { id: 'b', text: '[JourneyCode]-[Sufijo]' },
            { id: 'c', text: '[OrgId].[EstadoId]', explanation: 'El codigo de estado no incluye el orgId. Los estados son genericos del journey y no dependen de la organizacion. El formato es [JourneyCode]-[Sufijo].' },
            { id: 'd', text: '[NodeType]:[Estado]', explanation: 'El codigo de estado no incluye el tipo de nodo. El formato usa el codigo del journey como prefijo (ej: LMV1-OR), no el tipo de nodo.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c2l4q6',
          question: 'Como se permite el reintento de entrega en el journey LMV1?',
          options: [
            { id: 'a', text: 'Se crea un nuevo envio con los mismos datos', explanation: 'No se crea un nuevo envio para reintentar. El mismo envio retrocede de failed_delivery a out_for_delivery mediante una transicion NEXT valida.' },
            { id: 'b', text: 'Existe una transicion NEXT de failed_delivery (FD) de vuelta a out_for_delivery (OF)' },
            { id: 'c', text: 'El estado delivered se puede revertir manualmente', explanation: 'El estado delivered es terminal y no puede revertirse. Los reintentos ocurren desde failed_delivery, no desde delivered.' },
            { id: 'd', text: 'Se usa un journey diferente para el segundo intento', explanation: 'Se usa el mismo journey LMV1 para todos los intentos. La transicion NEXT de FD a OF crea un ciclo controlado dentro del mismo journey.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c2l4q7',
          question: 'Que sucede cuando el sistema valida un cambio de estado en un envio?',
          options: [
            { id: 'a', text: 'Verifica que el nuevo estado pertenezca a cualquier journey del sistema', explanation: 'No basta con que el estado exista en algun journey. Debe existir una relacion NEXT especifica entre el estado actual y el nuevo estado dentro del journey asociado al nodo.' },
            { id: 'b', text: 'Permite cualquier cambio de estado siempre que el usuario tenga permisos', explanation: 'Los permisos del usuario no son suficientes. El sistema valida que la transicion sea estructuralmente valida segun las relaciones NEXT del journey.' },
            { id: 'c', text: 'Valida que exista una relacion NEXT entre el estado actual y el nuevo estado dentro del journey' },
            { id: 'd', text: 'Solo verifica que el nuevo estado no sea un estado terminal', explanation: 'La validacion no se limita a verificar si el estado es terminal. Verifica que exista una relacion NEXT valida entre el estado actual y el propuesto, impidiendo saltar estados.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c2l4q8',
          question: 'Que propiedad del nodo de la Network determina que journey se aplica a los envios que llegan?',
          options: [
            { id: 'a', text: 'nodeType', explanation: 'nodeType define el tipo de nodo (warehouse, lm, etc.) pero no especifica directamente que journey se aplica. La propiedad especifica es journeyCode.' },
            { id: 'b', text: 'journeyCode' },
            { id: 'c', text: 'orgType', explanation: 'orgType indica si la organizacion del nodo es interna o externa. No tiene relacion con la asignacion de journeys a los envios.' },
            { id: 'd', text: 'name', explanation: 'name es el identificador corto del nodo (shortcode). No determina que journey se aplica a los envios que llegan.' }
          ],
          correctOptionId: 'b'
        }
      ]
    }
  },

  // LESSON 5
  {
    title: 'NodeConfig y Configuracion',
    order: 5,
    content: `
<h2>Configuracion Adicional en MongoDB</h2>
<p>Ademas de la topologia almacenada en Neo4j (nodos, propiedades y relaciones GO), cada nodo puede tener <strong>configuracion adicional almacenada en MongoDB</strong>. Esta configuracion extiende las capacidades del nodo con datos operativos que no forman parte del grafo.</p>

<div class="callout">
<strong>Concepto clave:</strong> Neo4j almacena la topologia de la red (nodos y relaciones), mientras que MongoDB almacena la configuracion operativa de cada nodo. Ambas fuentes de datos trabajan juntas para definir completamente el comportamiento de un nodo en la red.
</div>

<h2>Propiedades de NodeConfig en MongoDB</h2>
<p>El documento NodeConfig en MongoDB puede incluir las siguientes configuraciones:</p>

<table>
<tr><th>Propiedad</th><th>Descripcion</th><th>Uso</th></tr>
<tr><td><strong>routes</strong></td><td>Codigos de ruta asociados al nodo</td><td>Define que rutas de transporte pasan por este nodo. Utilizado para asignar envios a rutas especificas y para la planificacion de manifiestos de despacho.</td></tr>
<tr><td><strong>pendingPallets</strong></td><td>Configuracion de pallets pendientes</td><td>Gestiona la asignacion de pallets y la consolidacion de envios en el nodo. Relevante principalmente para nodos de tipo warehouse.</td></tr>
<tr><td><strong>associatedCosts</strong></td><td>Costos asociados al procesamiento en el nodo</td><td>Define los costos operativos de procesar envios en este nodo. Usado para calcular tarifas y facturacion entre organizaciones.</td></tr>
</table>

<h2>Como la Network Impulsa los Envios</h2>
<p>La Network no es solo un modelo estatico de la infraestructura logistica. Es el motor que impulsa todo el ciclo de vida de un envio en SyncFreight. A continuacion se detalla como la Network interviene en cada etapa:</p>

<h3>1. Creacion del Envio</h3>
<p>Cuando se crea un nuevo envio, el sistema utiliza la Network para calcular su ruta:</p>
<ul>
<li>Se identifica el <strong>entry point</strong> del shipper que origina el envio.</li>
<li>Se identifica el <strong>nodo postalcode</strong> correspondiente al codigo postal de destino.</li>
<li>El algoritmo de ruteo busca un camino valido en el grafo desde el entry point hasta el postalcode, atravesando las relaciones GO.</li>
<li>La ruta calculada puede <strong>cruzar fronteras organizacionales</strong> si es necesario (por ejemplo, pasando de un warehouse de Org A a un operador lm de Org B).</li>
<li>Se usa para determinar que exista un camino para entregar el paquete, si no fuera así se rechaza la creación.</li>
</ul>

<div class="callout">
<strong>Ejemplo de path[]:</strong> Un envio con destino al codigo postal 07001 podria tener el siguiente path:
<code>["SYPHP", "EWR", "BREACH-INLAND", "AGENA", "postalCode_07001"]</code>
Esto indica que el envio pasa por el entry point SYPHP, el warehouse EWR, un punto breach, el operador de ultima milla AGENA, y finalmente llega al codigo postal de destino.
</div>

<h3>2. Avance en la Red (Network Advancement)</h3>
<p>A medida que el envio es procesado en cada nodo de su ruta, avanza en su <code>path[]</code> (El array de path se va construyendo conforme avanza en la red):</p>
<ul>
<li>Cuando un envio llega a un nodo, el sistema lo agrega al <code>path[]</code>.</li>
<li>Al completar el procesamiento en el nodo actual, el envio avanza al siguiente nodo del path.</li>
<li>En cada avance, se aplica el <strong>journey correspondiente</strong> al nuevo nodo, iniciando el flujo de estados definido por <code>shipmentJourneyInitialState</code>.</li>
</ul>

<h3>3. Actualizacion de Estados</h3>
<p>En cada nodo de la ruta, el journey asociado al nodo define las transiciones de estado validas:</p>
<ul>
<li>Al llegar a un nodo, el envio recibe el estado inicial del journey (<code>shipmentJourneyInitialState</code>).</li>
<li>Los operadores del nodo pueden actualizar el estado del envio siguiendo las transiciones NEXT validas.</li>
<li>Cuando el envio alcanza un estado que permite el avance (o un estado terminal del journey del nodo), puede progresar al siguiente nodo del path.</li>
</ul>

<h3>4. Asignacion de Vendor</h3>
<p>La Network tambien se utiliza para validar asignaciones de vendor:</p>
<ul>
<li>Cuando se necesita asignar un vendor (organizacion externa que ejecuta la entrega), el sistema valida que exista una <strong>ruta valida</strong> entre el nodo actual y el codigo postal de destino pasando por un nodo del vendor.</li>
<li>Esto garantiza que solo se asignen vendors que esten fisicamente conectados en la red y puedan atender el codigo postal de destino.</li>
</ul>

<h3>5. Replicacion Cross-Org</h3>
<p>Cuando un envio cruza una frontera organizacional (pasa de un nodo de Org A a un nodo de Org B), se activa la <strong>replicacion de estados</strong>:</p>
<ul>
<li>El envio existe en la base de datos de ambas organizaciones (recordemos que cada org tiene su propia MongoDB).</li>
<li>Los cambios de estado en una organizacion se replican a la otra para mantener la trazabilidad completa.</li>
<li>Esto permite que tanto el broker como el vendor puedan ver el estado actualizado del envio en todo momento.</li>
</ul>

<div class="callout warning">
<strong>Importante sobre la replicacion:</strong> La replicacion cross-org solo se activa cuando un envio cruza fronteras organizacionales. Si un envio se mueve entre nodos de la misma organizacion, no hay replicacion porque todo se gestiona en la misma base de datos MongoDB.
</div>

<h2>Resumen del Ciclo de Vida</h2>
<table>
<tr><th>Etapa</th><th>Componente de la Network</th><th>Accion</th></tr>
<tr><td>Creacion</td><td>Entry point + Postalcode + Relaciones GO</td><td>Calcula la ruta (path[]) del envio</td></tr>
<tr><td>Avance</td><td>Path[] + Nodos de la ruta</td><td>Mueve el envio al siguiente nodo y aplica el journey</td></tr>
<tr><td>Estados</td><td>Journey del nodo actual + Relaciones NEXT</td><td>Define y valida las transiciones de estado</td></tr>
<tr><td>Vendor</td><td>Relaciones GO + Postalcode</td><td>Valida que exista ruta entre nodo actual y destino via vendor</td></tr>
<tr><td>Replicacion</td><td>Fronteras organizacionales</td><td>Sincroniza estados entre bases de datos de distintas orgs</td></tr>
</table>

<h2>Integracion Neo4j + MongoDB</h2>
<p>En resumen, la Network opera con una arquitectura de dos capas de datos:</p>
<ul>
<li><strong>Neo4j:</strong> Almacena la topologia (nodos, relaciones GO, journeys con relaciones NEXT). Es la fuente de verdad para el ruteo y las transiciones de estado.</li>
<li><strong>MongoDB:</strong> Almacena la configuracion operativa (NodeConfig con routes, pendingPallets, associatedCosts) y los datos de los envios (incluyendo el path[] calculado a partir del grafo).</li>
</ul>
<p>Ambas bases de datos trabajan en conjunto: Neo4j define la estructura de la red y las reglas, mientras que MongoDB almacena los datos operativos y de configuracion que hacen funcionar la red en el dia a dia.</p>
`,
    test: {
      questions: [
        {
          id: 'c2l5q1',
          question: 'Donde se almacena la configuracion operativa adicional de cada nodo (NodeConfig)?',
          options: [
            { id: 'a', text: 'En Neo4j, como propiedades adicionales del nodo', explanation: 'Neo4j almacena la topologia de la red (nodos y relaciones GO/NEXT). La configuracion operativa como routes y costos se almacena por separado en MongoDB.' },
            { id: 'b', text: 'En MongoDB, como un documento separado' },
            { id: 'c', text: 'En Redis, para acceso rapido en tiempo real', explanation: 'El sistema no utiliza Redis para almacenar configuracion de nodos. MongoDB es la base de datos usada para documentos NodeConfig.' },
            { id: 'd', text: 'En un archivo de configuracion del servidor', explanation: 'La configuracion de nodos no se almacena en archivos estaticos del servidor. Se guarda en MongoDB como documentos que pueden ser consultados y actualizados dinamicamente.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c2l5q2',
          question: 'Que propiedades puede incluir un documento NodeConfig?',
          options: [
            { id: 'a', text: 'name, orgId y nodeType', explanation: 'Estas son propiedades del nodo almacenadas en Neo4j como parte de la topologia, no de la configuracion operativa en MongoDB.' },
            { id: 'b', text: 'routes, pendingPallets y associatedCosts' },
            { id: 'c', text: 'journeyCode, initial y terminal', explanation: 'Estas son propiedades de los nodos de estado dentro de un journey en Neo4j, no del documento NodeConfig en MongoDB.' },
            { id: 'd', text: 'orgType, parentOrg y defaultLocation', explanation: 'Estas son propiedades del nodo en Neo4j que definen su identidad organizacional y ubicacion, no configuracion operativa de NodeConfig.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c2l5q3',
          question: 'Como se calcula la ruta de un envio al ser creado?',
          options: [
            { id: 'a', text: 'Se asigna manualmente por un operador basandose en la experiencia', explanation: 'La ruta no se asigna manualmente. El sistema la calcula automaticamente recorriendo el grafo en Neo4j desde el entry point hasta el postalcode de destino.' },
            { id: 'b', text: 'Se busca un camino valido en el grafo desde el entry point del shipper hasta el nodo postalcode de destino, siguiendo relaciones GO' },
            { id: 'c', text: 'Se usa siempre la misma ruta predefinida para cada codigo postal', explanation: 'No existen rutas predefinidas estaticas. El algoritmo calcula dinamicamente la ruta siguiendo las relaciones GO del grafo, que pueden variar segun la configuracion de la red.' },
            { id: 'd', text: 'Se consulta una API externa de ruteo geografico', explanation: 'No se usa una API externa. El ruteo se realiza internamente recorriendo el grafo de Neo4j mediante relaciones GO entre nodos.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c2l5q4',
          question: 'Que es el path[] de un envio?',
          options: [
            { id: 'a', text: 'La lista de estados por los que ha pasado el envio', explanation: 'El path[] contiene nodos de la Network (entry points, warehouses, etc.), no estados de journeys. Los estados se gestionan por separado dentro de cada nodo.' },
            { id: 'b', text: 'El arreglo que contiene la ruta de nodos que el envio ha segido' },
            { id: 'c', text: 'La secuencia de organizaciones involucradas en la entrega', explanation: 'El path[] contiene nombres de nodos especificos (ej: SYPHP, EWR, AGENA), no nombres de organizaciones. Un nodo puede pertenecer a diferentes organizaciones.' },
            { id: 'd', text: 'Las coordenadas GPS de cada punto de la ruta', explanation: 'El path[] almacena identificadores de nodos de la Network, no coordenadas GPS. Ejemplo: ["SYPHP", "EWR", "AGENA", "postalCode_07001"].' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c2l5q5',
          question: 'Cuando se activa la replicacion cross-org?',
          options: [
            { id: 'a', text: 'En cada cambio de estado del envio, sin importar la organizacion', explanation: 'La replicacion no se activa en cada cambio de estado. Solo se activa cuando el envio cruza una frontera organizacional, ya que dentro de una misma org todo se gestiona en la misma MongoDB.' },
            { id: 'b', text: 'Solo cuando un envio cruza una frontera organizacional, pasando de un nodo de una org a un nodo de otra org' },
            { id: 'c', text: 'Cuando el envio llega a un estado terminal', explanation: 'Llegar a un estado terminal no activa la replicacion. La replicacion se activa al cruzar fronteras organizacionales, independientemente del estado del envio.' },
            { id: 'd', text: 'La replicacion esta siempre activa para todos los envios', explanation: 'La replicacion no esta siempre activa. Solo se necesita cuando un envio se mueve entre nodos de diferentes organizaciones, cada una con su propia MongoDB.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c2l5q6',
          question: 'Como se valida la asignacion de un vendor para la entrega?',
          options: [
            { id: 'a', text: 'Se verifica que el vendor tenga una cuenta activa en SyncFreight', explanation: 'Tener cuenta activa no es suficiente. El sistema valida que exista una ruta valida en el grafo que conecte el nodo actual con el destino pasando por un nodo del vendor.' },
            { id: 'b', text: 'Se valida que exista una ruta valida en la Network entre el nodo actual y el codigo postal de destino pasando por un nodo del vendor' },
            { id: 'c', text: 'Se comprueba que el vendor tenga disponibilidad de drivers', explanation: 'La disponibilidad de drivers no es parte de la validacion de asignacion de vendor. Lo que se valida es la conectividad en la Network entre el nodo actual y el destino via el vendor.' },
            { id: 'd', text: 'No se valida, cualquier vendor puede ser asignado a cualquier envio', explanation: 'Si se valida. Solo se pueden asignar vendors que esten fisicamente conectados en la red y puedan atender el codigo postal de destino mediante relaciones GO.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c2l5q7',
          question: 'Que rol cumple Neo4j vs MongoDB en la arquitectura de la Network?',
          options: [
            { id: 'a', text: 'Neo4j almacena los envios y MongoDB almacena los nodos', explanation: 'Es al reves: Neo4j almacena los nodos y su topologia (relaciones GO y NEXT), mientras que MongoDB almacena los datos de envios y la configuracion operativa.' },
            { id: 'b', text: 'Neo4j almacena la topologia y reglas (nodos, relaciones, journeys), MongoDB almacena la configuracion operativa y datos de envios' },
            { id: 'c', text: 'Ambas bases de datos almacenan la misma informacion como respaldo mutuo', explanation: 'No son respaldo mutuo. Cada base de datos almacena informacion diferente y complementaria: Neo4j la topologia y MongoDB los datos operativos.' },
            { id: 'd', text: 'Neo4j solo se usa para reportes y MongoDB para todas las operaciones', explanation: 'Neo4j no es solo para reportes. Es la fuente de verdad para el ruteo de envios y las transiciones de estado, funciones operativas criticas del sistema.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c2l5q8',
          question: 'Que ocurre cuando un envio avanza al siguiente nodo de su path[]?',
          options: [
            { id: 'a', text: 'Se mantiene el mismo journey y estado del nodo anterior', explanation: 'No se mantiene el journey anterior. Cada nodo tiene su propio journey y al llegar al nuevo nodo, se aplica el journey correspondiente con su estado inicial.' },
            { id: 'b', text: 'Se aplica el journey del nuevo nodo y el envio recibe el estado inicial definido por shipmentJourneyInitialState' },
            { id: 'c', text: 'Se reinicia el envio desde cero con un nuevo tracking number', explanation: 'El envio no se reinicia ni cambia de tracking number. Simplemente avanza en su path[] y comienza el journey del nuevo nodo manteniendo su identidad.' },
            { id: 'd', text: 'Solo cambia la ubicacion del envio, los estados no se modifican', explanation: 'Los estados si se modifican al avanzar de nodo. El envio recibe automaticamente el estado inicial del journey del nuevo nodo (shipmentJourneyInitialState).' }
          ],
          correctOptionId: 'b'
        }
      ]
    }
  }
];
