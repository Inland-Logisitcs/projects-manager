export const course3Data = {
  title: 'Conexion entre Organizaciones y Envios',
  description: 'Aprende como las organizaciones se conectan, la replicacion de estados, y los flujos de envios completos incluyendo journeys WHV1 y LMV1.',
  order: 3,
  published: true,
  totalLessons: 6
};

export const course3Lessons = [
  // LESSON 1
  {
    title: 'Modelo de Conexion',
    order: 1,
    content: `
<h2>Como se Conectan las Organizaciones en SYNC</h2>
<p>Cuando una Organizacion A desea trabajar con una Organizacion B, cada una crea una <strong>representacion de la otra</strong> en su propia base de datos. Esta representacion se denomina <strong>organizacion externa</strong> (external organization).</p>

<div class="callout">
<strong>Concepto clave:</strong> La organizacion externa no es la organizacion real, sino una referencia local que permite a cada base de datos conocer y operar con la otra parte sin acceder directamente a sus datos.
</div>

<h2>Ejemplo Practico</h2>
<p>Supongamos que <strong>Broker Alpha</strong> quiere contratar a <strong>Vendor Express</strong> para operaciones de ultima milla:</p>
<table>
<tr><th>Base de Datos</th><th>Organizacion Externa Creada</th><th>Rol Asignado</th></tr>
<tr><td>Broker Alpha</td><td>Vendor Express</td><td>vendor</td></tr>
<tr><td>Vendor Express</td><td>Broker Alpha</td><td>shipper</td></tr>
</table>
<p>Cada organizacion ve a la otra desde su propia perspectiva: Broker Alpha ve a Vendor Express como su proveedor logistico (<code>vendor</code>), mientras que Vendor Express ve a Broker Alpha como la empresa que le envia carga (<code>shipper</code>).</p>

<h2>Flujo de Creacion Paso a Paso</h2>
<p>El proceso de conexion entre organizaciones sigue un flujo bien definido con multiples pasos que involucran MongoDB y Neo4j:</p>


<h3>Paso 1: Persistencia en MongoDB</h3>
<p>La organizacion externa se guarda en la base de datos de Broker Alpha como un documento de tipo <strong>external organization</strong>, conteniendo los datos basicos del vendor y la configuracion de la relacion.</p>

<h3>Paso 2: Creacion de Base de Datos del Vendor</h3>
<p>La base de datos del vendor se va a crear automaticamente en MongoDB cuando se necesite.</p>

<h3>Paso 3: Replicacion Inversa</h3>
<p>Broker Alpha se replica automaticamente dentro de la base de datos de Vendor Express como una organizacion externa con rol <code>shipper</code>. Esto permite que Vendor Express sepa quien le envia carga.</p>

<h3>Paso 4: Vinculacion en Neo4j</h3>
<p>Se crean las relaciones correspondientes en Neo4j, vinculando los nodos asociados de ambas organizaciones con relaciones de tipo <code>GO</code> (Goes To). Esto permite que el sistema calcule rutas que cruzan entre organizaciones.</p>

<div class="callout warning">
<strong>Importante:</strong> La creacion de la organizacion externa es un proceso atomico que involucra tres sistemas: MongoDB (documentos), Neo4j (grafos) y potencialmente la creacion de una nueva base de datos. Si alguno de estos pasos falla, el proceso completo debe revertirse.
</div>

<h2>Resumen del Flujo</h2>
<ul>
<li>La conexion entre organizaciones es <strong>bidireccional</strong>: cada una tiene una representacion de la otra</li>
<li>Los roles se asignan segun la perspectiva de cada organizacion</li>
<li>La creacion puede implicar generar una nueva base de datos MongoDB</li>
<li>Neo4j registra las relaciones entre nodos de ambas organizaciones</li>
<li>Todo el proceso se ejecuta de forma coordinada para mantener la consistencia</li>
</ul>
`,
    test: {
      questions: [
        {
          id: 'c3l1q1',
          question: 'Que es una "organizacion externa" en el contexto de SYNC?',
          options: [
            { id: 'a', text: 'Una representacion local de otra organizacion dentro de la propia base de datos' },
            { id: 'b', text: 'Una organizacion que no tiene cuenta en SYNC y opera manualmente', explanation: 'Una organizacion externa no se refiere a si tiene o no cuenta en SYNC. Es una representacion local que cada organizacion crea de la otra en su propia base de datos.' },
            { id: 'c', text: 'Una copia completa de la base de datos de la otra organizacion', explanation: 'No es una copia completa de la base de datos. Es solo una referencia local que permite operar con la otra parte sin acceder directamente a sus datos.' },
            { id: 'd', text: 'Un usuario externo con permisos limitados en el sistema', explanation: 'No es un usuario externo. Es una representacion de otra organizacion a nivel de entidad, no un usuario individual con permisos.' }
          ],
          correctOptionId: 'a'
        },
        {
          id: 'c3l1q2',
          question: 'En el ejemplo de Broker Alpha y Vendor Express, que rol ve Vendor Express al mirar a Broker Alpha en su propia base de datos?',
          options: [
            { id: 'a', text: 'vendor', explanation: 'Vendor es el rol que Broker Alpha asigna a Vendor Express en su propia base de datos, no al reves. Los roles se asignan segun la perspectiva de quien crea la referencia.' },
            { id: 'b', text: 'broker', explanation: 'El rol broker no existe como tipo de organizacion externa en SYNC. Los roles disponibles son shipper, vendor y serviceProvider.' },
            { id: 'c', text: 'shipper' },
            { id: 'd', text: 'serviceProvider', explanation: 'El rol serviceProvider es para terceros que ofrecen servicios complementarios como cross-docking. Broker Alpha envia carga, por lo que desde la perspectiva de Vendor Express es un shipper.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c3l1q3',
          question: 'Que ocurre en el Paso 3 del flujo de creacion si el vendor ya tiene base de datos en SYNC?',
          options: [
            { id: 'a', text: 'Se crea una segunda base de datos para la nueva relacion', explanation: 'El modelo de multi-tenencia asigna una unica base de datos por organizacion. No se crean bases de datos adicionales por cada relacion.' },
            { id: 'b', text: 'Se omite la creacion de base de datos y se continua con los demas pasos' },
            { id: 'c', text: 'Se elimina la base de datos existente y se crea una nueva', explanation: 'Nunca se elimina una base de datos existente. Eso destruiria todos los datos de la organizacion y sus relaciones previas.' },
            { id: 'd', text: 'El proceso de conexion se cancela automaticamente', explanation: 'El proceso no se cancela. La creacion de base de datos es condicional, y si ya existe, simplemente se continua con los pasos restantes (replicacion inversa y Neo4j).' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c3l1q4',
          question: 'Que tipo de relacion se crea en Neo4j al vincular nodos de dos organizaciones?',
          options: [
            { id: 'a', text: 'CONNECTS_TO', explanation: 'CONNECTS_TO no es un tipo de relacion utilizado en el modelo de grafos de SYNC. La relacion correcta es GO (Goes To).' },
            { id: 'b', text: 'BELONGS_TO', explanation: 'BELONGS_TO no es la relacion usada para vincular nodos entre organizaciones. GO (Goes To) es la que permite calcular rutas entre ellas.' },
            { id: 'c', text: 'GO (Goes To)' },
            { id: 'd', text: 'LINKED_WITH', explanation: 'LINKED_WITH no existe en el modelo de Neo4j de SYNC. Las relaciones entre nodos de organizaciones se crean con el tipo GO (Goes To).' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c3l1q5',
          question: 'La conexion entre organizaciones es unidireccional o bidireccional?',
          options: [
            { id: 'a', text: 'Unidireccional: solo el creador tiene la referencia', explanation: 'La conexion no es unidireccional. En el Paso 4 (replicacion inversa), la organizacion creadora se replica automaticamente en la base de datos del vendor, creando una referencia bidireccional.' },
            { id: 'b', text: 'Bidireccional: cada organizacion tiene una representacion de la otra' },
            { id: 'c', text: 'Depende del rol asignado a la organizacion externa', explanation: 'La bidireccionalidad no depende del rol. Independientemente de si el rol es shipper, vendor o serviceProvider, siempre se crea una representacion en ambas bases de datos.' },
            { id: 'd', text: 'Es unidireccional pero puede convertirse en bidireccional manualmente', explanation: 'No requiere accion manual adicional. La replicacion inversa ocurre automaticamente como parte del proceso atomico de creacion de la organizacion externa.' }
          ],
          correctOptionId: 'b'
        },
      ]
    }
  },
  // LESSON 2
  {
    title: 'Roles y Naturaleza',
    order: 2,
    content: `
<h2>Roles de las Organizaciones Externas</h2>
<p>Cuando se crea una organizacion externa, se le asigna un <strong>rol</strong> que define su funcion dentro de la relacion logistica. Existen tres roles principales:</p>

<table>
<tr><th>Rol</th><th>Descripcion</th><th>Ejemplo</th></tr>
<tr><td><strong>shipper</strong></td><td>Empresa que envia carga y origina los envios. Es quien genera la demanda de transporte.</td><td>Una tienda de ecommerce que necesita enviar pedidos a sus clientes</td></tr>
<tr><td><strong>vendor</strong></td><td>Proveedor logistico que ejecuta parte de la operacion, como la ultima milla o middle-mile.</td><td>Un operador de delivery local que realiza las entregas en una zona especifica</td></tr>
<tr><td><strong>serviceProvider</strong></td><td>Tercero que ofrece servicios complementarios a la operacion logistica principal.</td><td>Un servicio de cross-docking que consolida y redistribuye paquetes</td></tr>
</table>

<div class="callout">
<strong>Concepto clave:</strong> El rol se asigna desde la perspectiva de quien crea la organizacion externa. Si Broker Alpha crea a Vendor Express, le asigna rol <code>vendor</code>. Pero en la base de datos de Vendor Express, Broker Alpha aparece con rol <code>shipper</code>.
</div>

<h2>Naturaleza de la Organizacion Externa</h2>
<p>Ademas del rol, cada organizacion externa tiene una <strong>naturaleza</strong> que determina como se comunican los sistemas entre si. Hay dos naturalezas posibles:</p>

<h3>Internal (Interna)</h3>
<ul>
<li>La organizacion tiene su <strong>propia cuenta SYNC</strong></li>
<li>La replicacion de estados se hace <strong>directamente entre bases de datos</strong> de SYNC</li>
<li>Comunicacion nativa a traves de funciones internas del sistema</li>
<li>No requiere traduccion de estados ni adaptadores externos</li>
</ul>

<h3>External (Externa)</h3>
<ul>
<li>La organizacion usa su <strong>propio sistema</strong> (Xcelerator, CXT, u otro)</li>
<li>La replicacion se realiza mediante <strong>HTTP handlers</strong> que envian datos al sistema externo</li>
<li>Requiere <strong>mapeo de estados</strong> a traves de la configuracion <code>trackingEventsIntegration</code></li>
<li>Los estados de SYNC deben traducirse al formato que entiende la plataforma externa</li>
</ul>

<div class="callout warning">
<strong>Importante:</strong> La naturaleza <code>external</code> no significa que la organizacion sea menos importante. Simplemente indica que no usa SYNC como su plataforma, por lo que la comunicacion requiere adaptadores y traducciones de datos.
</div>

<h2>Opciones de Configuracion</h2>
<p>Las organizaciones externas tienen multiples opciones de configuracion que controlan el comportamiento de la relacion:</p>

<table>
<tr><th>Opcion</th><th>Descripcion</th><th>Tipo</th></tr>
<tr><td><code>seeDriversDetails</code></td><td>Controla si la organizacion externa puede ver informacion de los conductores (nombre, telefono, ubicacion)</td><td>Boolean</td></tr>
<tr><td><code>trackingEventsIntegration</code></td><td>Configuracion del mapeo de estados entre SYNC y la plataforma externa. Incluye <code>statusMapping</code> que traduce cada estado de SYNC a su equivalente externo</td><td>Object</td></tr>
<tr><td><code>lostDeduction</code></td><td>Porcentaje o monto de deduccion aplicado cuando un paquete se reporta como perdido</td><td>Number</td></tr>
<tr><td><code>inspectionRate</code></td><td>Tasa de inspeccion aplicada a los envios procesados por esta organizacion</td><td>Number</td></tr>
<tr><td><code>permissions</code></td><td>Permisos especificos otorgados a la organizacion (ej: <code>manage_users</code>, acceso a reportes, etc.)</td><td>Array</td></tr>
</table>

<h3>Ejemplo de trackingEventsIntegration</h3>
<p>Para una organizacion externa que usa la plataforma CXT, el mapeo de estados podria verse asi:</p>
<pre><code>{
  "statusMapping": {
    "order_received": "RECIBIDO",
    "warehouse": "EN_ALMACEN",
    "dispatched": "DESPACHADO",
    "out_for_delivery": "EN_RUTA",
    "delivered": "ENTREGADO",
    "lost": "EXTRAVIADO"
  }
}</code></pre>
<p>Este mapeo asegura que cuando SYNC registra un cambio de estado, el sistema externo reciba el codigo equivalente en su propio formato.</p>

<h2>Resumen</h2>
<ul>
<li>Los <strong>roles</strong> (shipper, vendor, serviceProvider) definen la funcion logistica de la organizacion</li>
<li>La <strong>naturaleza</strong> (internal/external) determina el mecanismo de comunicacion</li>
<li>Las <strong>opciones de configuracion</strong> permiten personalizar la relacion entre organizaciones</li>
<li>El <code>trackingEventsIntegration</code> es esencial para organizaciones externas, ya que traduce estados entre plataformas</li>
</ul>
`,
    test: {
      questions: [
        {
          id: 'c3l2q1',
          question: 'Cual es la funcion del rol "vendor" en una organizacion externa?',
          options: [
            { id: 'a', text: 'Originar y enviar carga al sistema logistico', explanation: 'Originar y enviar carga es la funcion del rol shipper. El vendor es quien ejecuta la operacion logistica, no quien genera la demanda de transporte.' },
            { id: 'b', text: 'Ejecutar parte de la operacion logistica como proveedor' },
            { id: 'c', text: 'Ofrecer servicios complementarios como cross-docking', explanation: 'Ofrecer servicios complementarios como cross-docking corresponde al rol serviceProvider, no al vendor. El vendor ejecuta directamente la operacion de transporte.' },
            { id: 'd', text: 'Administrar la configuracion global del sistema', explanation: 'Ningun rol de organizacion externa administra la configuracion global del sistema. El vendor es un proveedor logistico que ejecuta parte de la operacion.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c3l2q2',
          question: 'Que distingue a una organizacion de naturaleza "internal" de una "external"?',
          options: [
            { id: 'a', text: 'La interna tiene mas permisos que la externa', explanation: 'La naturaleza no define permisos. Define el mecanismo de comunicacion: si usa SYNC directamente o requiere adaptadores HTTP para comunicarse con un sistema externo.' },
            { id: 'b', text: 'La interna usa SYNC y la comunicacion es directa entre bases de datos; la externa usa su propio sistema y requiere HTTP handlers' },
            { id: 'c', text: 'La interna pertenece al mismo grupo corporativo y la externa no', explanation: 'La naturaleza no tiene relacion con la estructura corporativa. Se refiere a si la organizacion usa SYNC como plataforma (internal) o tiene su propio sistema (external).' },
            { id: 'd', text: 'No hay diferencia funcional, es solo una etiqueta administrativa', explanation: 'Hay una diferencia funcional significativa. La naturaleza determina si la comunicacion es directa entre bases de datos o requiere HTTP handlers con traduccion de estados.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c3l2q3',
          question: 'Para que sirve la configuracion trackingEventsIntegration?',
          options: [
            { id: 'a', text: 'Para rastrear la ubicacion GPS de los envios en tiempo real', explanation: 'El trackingEventsIntegration no se relaciona con GPS. Su funcion es contener el statusMapping que traduce estados de SYNC al formato de la plataforma externa.' },
            { id: 'b', text: 'Para configurar alertas automaticas de eventos de tracking', explanation: 'No configura alertas automaticas. Contiene el statusMapping que traduce cada estado de SYNC a su equivalente en la plataforma externa.' },
            { id: 'c', text: 'Para mapear estados de SYNC al formato de la plataforma externa' },
            { id: 'd', text: 'Para integrar eventos de tracking con Google Analytics', explanation: 'No tiene relacion con Google Analytics. Es una configuracion que traduce los estados internos de SYNC al formato que entiende la plataforma externa de la organizacion.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c3l2q4',
          question: 'Que controla la opcion seeDriversDetails?',
          options: [
            { id: 'a', text: 'Si los conductores pueden ver detalles de la organizacion externa', explanation: 'Es al reves: controla si la organizacion externa puede ver informacion de los conductores (nombre, telefono, ubicacion), no si los conductores ven datos de la organizacion.' },
            { id: 'b', text: 'Si la organizacion externa puede ver informacion de los conductores' },
            { id: 'c', text: 'Si los conductores tienen acceso al panel de administracion', explanation: 'Esta opcion no controla el acceso de los conductores al sistema. Controla la visibilidad de la informacion de los conductores para la organizacion externa.' },
            { id: 'd', text: 'Si se muestran las rutas de los conductores en el mapa', explanation: 'No se refiere a la visualizacion de rutas en el mapa. Controla si la organizacion externa puede ver datos personales de los conductores como nombre, telefono y ubicacion.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c3l2q5',
          question: 'Que rol se le asigna tipicamente a una tienda de ecommerce que genera pedidos?',
          options: [
            { id: 'a', text: 'vendor', explanation: 'El vendor es quien ejecuta la operacion logistica (transporte, ultima milla). Una tienda de ecommerce que genera pedidos origina los envios, lo cual corresponde al rol shipper.' },
            { id: 'b', text: 'serviceProvider', explanation: 'El serviceProvider ofrece servicios complementarios como cross-docking. Una tienda de ecommerce que genera pedidos es quien origina la carga, es decir, un shipper.' },
            { id: 'c', text: 'shipper' },
            { id: 'd', text: 'broker', explanation: 'El rol broker no existe como tipo de organizacion externa en SYNC. Los tres roles disponibles son shipper, vendor y serviceProvider.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c3l2q7',
          question: 'Que representa la opcion lostDeduction en la configuracion de una organizacion externa?',
          options: [
            { id: 'a', text: 'El tiempo maximo antes de declarar un paquete como perdido', explanation: 'lostDeduction no se refiere a tiempo. Es un valor economico (porcentaje o monto) que se deduce cuando un paquete se reporta como perdido.' },
            { id: 'b', text: 'El porcentaje o monto de deduccion aplicado cuando un paquete se pierde' },
            { id: 'c', text: 'La cantidad de intentos de entrega antes de marcar como perdido', explanation: 'lostDeduction no define intentos de entrega. Es la deduccion economica aplicada al reportar un paquete como perdido, no una regla de reintentos.' },
            { id: 'd', text: 'El costo del seguro asociado a paquetes perdidos', explanation: 'lostDeduction no es un costo de seguro. Es el porcentaje o monto que se deduce como penalizacion cuando un paquete se pierde durante la operacion.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c3l2q8',
          question: 'Un servicio de cross-docking que consolida paquetes tendria que rol?',
          options: [
            { id: 'a', text: 'shipper', explanation: 'El shipper es quien origina los envios y genera demanda de transporte. Un servicio de cross-docking no origina carga, ofrece un servicio complementario de consolidacion.' },
            { id: 'b', text: 'vendor', explanation: 'El vendor ejecuta la operacion de transporte (ultima milla, middle-mile). Cross-docking es un servicio complementario, no una operacion de transporte directa.' },
            { id: 'c', text: 'serviceProvider' },
            { id: 'd', text: 'broker', explanation: 'El rol broker no existe como tipo de organizacion externa en SYNC. Un servicio de cross-docking seria un serviceProvider, que ofrece servicios complementarios a la operacion logistica.' }
          ],
          correctOptionId: 'c'
        }
      ]
    }
  },
  // LESSON 3
  {
    title: 'Replicacion de Estados',
    order: 3,
    content: `
<h2>Que es la Replicacion de Estados</h2>
<p>La replicacion de estados es el proceso mediante el cual los cambios de estado de un envio se <strong>propagan entre las bases de datos</strong> de las organizaciones involucradas. Cuando un conductor marca un paquete como "entregado" en la organizacion que ejecuta la operacion, ese estado debe reflejarse en la organizacion que origino el envio.</p>

<div class="callout">
<strong>Concepto clave:</strong> La replicacion garantiza que todas las partes de la cadena logistica tengan visibilidad actualizada del estado de cada envio, independientemente de donde se genere la actualizacion.
</div>

<h2>Replicacion para Organizaciones Internas</h2>
<p>Cuando ambas organizaciones usan SYNC (naturaleza <code>internal</code>), la replicacion es directa y eficiente:</p>

<ul>
<li>Se utiliza la funcion <code>replicateShipmentStatus()</code></li>
<li>Esta funcion se ejecuta de forma <strong>recursiva</strong>, propagando el estado a traves de toda la cadena de organizaciones</li>
<li>La comunicacion es directa entre las bases de datos MongoDB de cada organizacion</li>
</ul>

<h3>Datos Replicados</h3>
<table>
<tr><th>Campo</th><th>Descripcion</th></tr>
<tr><td><strong>state</strong></td><td>Nombre y codigo del estado actual del envio</td></tr>
<tr><td><strong>date</strong></td><td>Fecha y hora exacta del cambio de estado</td></tr>
<tr><td><strong>failure reasons</strong></td><td>Motivos de fallo si aplica (ej: direccion incorrecta, destinatario ausente)</td></tr>
<tr><td><strong>POD photos</strong></td><td>Fotografias de prueba de entrega tomadas por el conductor</td></tr>
<tr><td><strong>GPS location</strong></td><td>Coordenadas geograficas donde se registro el cambio de estado</td></tr>
<tr><td><strong>driver ID</strong></td><td>Identificador del conductor que realizo la accion</td></tr>
</table>

<h2>Replicacion para Organizaciones Externas</h2>
<p>Cuando la organizacion destino usa su propio sistema (naturaleza <code>external</code>), el proceso es diferente:</p>

<ul>
<li>Se encola una <strong>tarea asincrona</strong> en Google Cloud Tasks con el tipo <code>REPLICATESHIPMENTSTATUSEXTERNAL</code></li>
<li>Un <strong>handler especifico</strong> procesa la tarea y traduce el estado al formato de la plataforma externa</li>
<li>El mapeo de estados se configura en <code>trackingEventsIntegration.statusMapping</code></li>
<li>La comunicacion se realiza via HTTP hacia la API de la plataforma externa</li>
</ul>

<div class="callout warning">
<strong>Importante:</strong> La replicacion externa es asincrona. Esto significa que puede haber un breve retraso entre el cambio de estado en SYNC y su reflejo en la plataforma externa. Las tareas en Google Cloud Tasks incluyen reintentos automaticos en caso de fallo.
</div>

<h2>Campos de Replicacion en el Envio</h2>
<p>Cada envio contiene dos campos fundamentales que controlan la direccion de la replicacion:</p>

<h3>replicationParent</h3>
<p>Identifica la organizacion que <strong>origino el envio</strong> (shipper o broker). Los estados se replican <strong>hacia</strong> esta organizacion. Contiene:</p>
<ul>
<li><code>organizationId</code>: ID unico de la organizacion padre</li>
<li><code>name</code>: Nombre de la organizacion</li>
<li><code>orgType</code>: Tipo de organizacion (<code>internal</code> o <code>external</code>)</li>
<li><code>date</code>: Fecha de creacion de la relacion de replicacion</li>
</ul>

<h3>replicationChild</h3>
<p>Identifica la organizacion que <strong>ejecuta la operacion</strong> (vendor). Es la referencia de donde provienen las actualizaciones de estado. Contiene los mismos campos que replicationParent.</p>

<h3>Direccion del Flujo</h3>
<p>El flujo de replicacion sigue esta logica:</p>
<pre><code>Vendor (child) actualiza estado
       |
       v
replicateShipmentStatus() se ejecuta
       |
       v
Estado se replica HACIA el Parent (shipper/broker)
       |
       v
Si el parent tambien tiene un parent, se replica recursivamente</code></pre>

<h2>Comparacion de Mecanismos</h2>
<table>
<tr><th>Aspecto</th><th>Organizacion Interna</th><th>Organizacion Externa</th></tr>
<tr><td>Mecanismo</td><td>Funcion directa recursiva</td><td>Tarea asincrona en Cloud Tasks</td></tr>
<tr><td>Velocidad</td><td>Depende, puede ser sincrona o asincrona</td><td>Casi inmediata (asincrona con reintentos)</td></tr>
<tr><td>Traduccion</td><td>No requiere (mismo formato)</td><td>Requiere statusMapping</td></tr>
<tr><td>Protocolo</td><td>Interno MongoDB</td><td>HTTP hacia API externa</td></tr>
<tr><td>Reintentos</td><td>Manejo de errores interno</td><td>Reintentos automaticos de Cloud Tasks</td></tr>
</table>

<h2>Resumen</h2>
<ul>
<li>La replicacion propaga estados entre organizaciones de la cadena logistica</li>
<li>Para organizaciones internas: funcion directa y recursiva (<code>replicateShipmentStatus()</code>)</li>
<li>Para organizaciones externas: tareas asincronas en Google Cloud Tasks con traduccion de estados</li>
<li><code>replicationParent</code> indica hacia donde se replican los estados</li>
<li><code>replicationChild</code> indica de donde provienen las actualizaciones</li>
<li>Los datos replicados incluyen estado, fecha, motivos de fallo, fotos POD, GPS y driver ID</li>
</ul>
`,
    test: {
      questions: [
        {
          id: 'c3l3q1',
          question: 'Que funcion se utiliza para replicar estados entre organizaciones internas?',
          options: [
            { id: 'a', text: 'syncShipmentState()', explanation: 'syncShipmentState() no es el nombre correcto de la funcion. La funcion que replica estados entre organizaciones internas se llama replicateShipmentStatus().' },
            { id: 'b', text: 'replicateShipmentStatus()' },
            { id: 'c', text: 'propagateStatus()', explanation: 'propagateStatus() no existe en SYNC. La funcion correcta es replicateShipmentStatus(), que se ejecuta de forma recursiva a traves de la cadena de organizaciones.' },
            { id: 'd', text: 'updateExternalState()', explanation: 'updateExternalState() no es la funcion correcta. Ademas, el nombre sugiere organizaciones externas, pero la replicacion entre internas usa replicateShipmentStatus().' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c3l3q2',
          question: 'Como se replican los estados hacia organizaciones externas?',
          options: [
            { id: 'a', text: 'Mediante llamadas directas a la base de datos de la organizacion externa', explanation: 'No se accede directamente a la base de datos de la organizacion externa. La comunicacion se realiza via HTTP porque la organizacion usa su propio sistema fuera de SYNC.' },
            { id: 'b', text: 'A traves de WebSockets en tiempo real', explanation: 'SYNC no utiliza WebSockets para replicar estados hacia organizaciones externas. Se encolan tareas asincronas en Google Cloud Tasks que procesan la replicacion via HTTP.' },
            { id: 'c', text: 'Mediante una tarea asincrona en Google Cloud Tasks con handler HTTP' },
            { id: 'd', text: 'Por medio de archivos batch procesados cada hora', explanation: 'La replicacion no se hace por archivos batch. Se usa Google Cloud Tasks con procesamiento asincrono casi inmediato y reintentos automaticos, no procesamiento por lotes.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c3l3q3',
          question: 'Que campo del envio indica la organizacion que origino el envio?',
          options: [
            { id: 'a', text: 'replicationChild', explanation: 'El replicationChild identifica la organizacion que ejecuta la operacion (vendor), no la que origino el envio. Es de donde provienen las actualizaciones de estado.' },
            { id: 'b', text: 'replicationParent' },
            { id: 'c', text: 'originOrganization', explanation: 'El campo originOrganization no existe en el modelo de datos de SYNC. El campo correcto es replicationParent, que identifica la organizacion que origino el envio.' },
            { id: 'd', text: 'shipperReference', explanation: 'El campo shipperReference no es parte del modelo de replicacion. El campo replicationParent es el que identifica a la organizacion originadora del envio.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c3l3q4',
          question: 'Cuales de los siguientes datos NO se replican durante un cambio de estado?',
          options: [
            { id: 'a', text: 'Fotos de prueba de entrega (POD)', explanation: 'Las fotos POD si se replican durante un cambio de estado. Son parte de los datos que se propagan entre organizaciones junto con el estado, fecha, GPS y driver ID.' },
            { id: 'b', text: 'Ubicacion GPS del cambio de estado', explanation: 'La ubicacion GPS si se replica. Las coordenadas donde se registro el cambio de estado son parte de los datos que se propagan entre organizaciones.' },
            { id: 'c', text: 'Historial completo de facturacion del envio' },
            { id: 'd', text: 'Motivos de fallo si aplica', explanation: 'Los motivos de fallo si se replican cuando aplican. Son parte fundamental de la replicacion para que todas las organizaciones conozcan las razones de un fallo en la entrega.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c3l3q5',
          question: 'En que direccion fluyen los estados replicados?',
          options: [
            { id: 'a', text: 'Del parent hacia el child (de arriba hacia abajo)', explanation: 'La replicacion de estados fluye en direccion opuesta: del child al parent. El vendor (child) es quien ejecuta la operacion y genera las actualizaciones de estado.' },
            { id: 'b', text: 'Del child hacia el parent (de abajo hacia arriba)' },
            { id: 'c', text: 'En ambas direcciones simultaneamente', explanation: 'La replicacion de estados es unidireccional, del child al parent. No es bidireccional porque solo el vendor que ejecuta la operacion genera actualizaciones de estado.' },
            { id: 'd', text: 'Solo se replican dentro de la misma organizacion', explanation: 'Los estados se replican entre organizaciones diferentes, no dentro de la misma. El proposito de la replicacion es que el parent tenga visibilidad de los estados actualizados por el child.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c3l3q6',
          question: 'Que tipo de tarea se encola en Google Cloud Tasks para la replicacion externa?',
          options: [
            { id: 'a', text: 'SYNCSHIPMENTSTATUS', explanation: 'SYNCSHIPMENTSTATUS no es el nombre correcto del tipo de tarea. El tipo especifico para replicacion hacia organizaciones externas es REPLICATESHIPMENTSTATUSEXTERNAL.' },
            { id: 'b', text: 'REPLICATESHIPMENTSTATUSEXTERNAL' },
            { id: 'c', text: 'EXTERNALSTATUSUPDATE', explanation: 'EXTERNALSTATUSUPDATE no existe como tipo de tarea en SYNC. El tipo correcto es REPLICATESHIPMENTSTATUSEXTERNAL.' },
            { id: 'd', text: 'PROPAGATEEXTERNALSTATUS', explanation: 'PROPAGATEEXTERNALSTATUS no es un tipo de tarea valido. La tarea encolada para replicacion externa se llama REPLICATESHIPMENTSTATUSEXTERNAL.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c3l3q7',
          question: 'Que propiedad contiene el campo replicationChild?',
          options: [
            { id: 'a', text: 'Solo el organizationId y name', explanation: 'Falta informacion. Ademas de organizationId y name, el campo tambien incluye orgType (que determina el mecanismo de comunicacion) y date (fecha de creacion de la relacion).' },
            { id: 'b', text: 'organizationId, name, orgType (internal/external) y date' },
            { id: 'c', text: 'Solo el orgType y los permisos', explanation: 'Los permisos no forman parte del campo replicationChild. Este contiene organizationId, name, orgType y date, datos necesarios para identificar la organizacion y su tipo de comunicacion.' },
            { id: 'd', text: 'El historial completo de estados replicados', explanation: 'El historial de estados no se almacena en replicationChild. Este campo solo identifica la organizacion que ejecuta la operacion, con organizationId, name, orgType y date.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c3l3q8',
          question: 'Por que la replicacion de la funcion replicateShipmentStatus() es recursiva?',
          options: [
            { id: 'a', text: 'Porque los estados pueden tener sub-estados que deben procesarse individualmente', explanation: 'Los estados no tienen sub-estados que requieran recursion. La recursion existe para propagar el estado a traves de la cadena completa de organizaciones (parent del parent, etc.).' },
            { id: 'b', text: 'Porque si el parent tiene a su vez otro parent, el estado se propaga a traves de toda la cadena' },
            { id: 'c', text: 'Porque cada dato replicado (GPS, fotos, etc.) se procesa en una iteracion separada', explanation: 'Los datos replicados (GPS, fotos, etc.) se envian todos juntos en cada nivel de la cadena. La recursion no es por tipo de dato sino por nivel de organizacion en la cadena.' },
            { id: 'd', text: 'Porque los reintentos en caso de fallo se implementan con recursion', explanation: 'Los reintentos no se implementan con recursion. La recursion sirve para propagar el estado a traves de multiples niveles de organizaciones en la cadena logistica.' }
          ],
          correctOptionId: 'b'
        }
      ]
    }
  },
  // LESSON 4
  {
    title: 'Replicacion de Direcciones y Vinculacion Neo4j',
    order: 4,
    content: `
<h2>Replicacion de Direcciones</h2>
<p>A diferencia de la replicacion de estados (que fluye de abajo hacia arriba, del child al parent), la replicacion de direcciones es <strong>unidireccional de arriba hacia abajo</strong>: siempre del <strong>parent al child</strong>.</p>

<div class="callout">
<strong>Concepto clave:</strong> El parent (shipper/broker) tiene la <strong>autoridad sobre la direccion del envio</strong>. Si la direccion necesita ser corregida o actualizada, el cambio se origina en el parent y se propaga al child (vendor).
</div>

<h2>Flujo Completo de Actualizacion de Direccion</h2>
<p>El proceso de replicacion de direcciones involucra multiples pasos coordinados entre organizaciones:</p>

<h3>Paso 1: Actualizacion en el Parent</h3>
<p>Un usuario actualiza la direccion del envio en la organizacion parent. El <strong>Address Service</strong> se encarga de crear o actualizar la direccion, incluyendo el proceso de <strong>geocoding</strong> (conversion de direccion textual a coordenadas GPS).</p>

<h3>Paso 2: Deteccion del Child</h3>
<p>La funcion <code>updateShipment()</code> detecta que el envio tiene un <code>replicationChild</code> de tipo <code>internal</code>. Esto activa el proceso de replicacion hacia abajo.</p>

<h3>Paso 3: Encolamiento de Tarea</h3>
<p>Se encola una tarea <code>UPDATESHIPMENT</code> en Google Cloud Tasks. Esta tarea contiene la nueva direccion y los datos del envio actualizados.</p>

<h3>Paso 4: Procesamiento en el Child</h3>
<p>La funcion <code>updateFromTaskManager()</code> en la organizacion child recibe la tarea y realiza las siguientes verificaciones:</p>
<ul>
<li>Busca el envio por <code>trackingNumber</code> en la base de datos del child</li>
<li>Verifica que el <code>parentOrg</code> del envio coincida con la organizacion que envio la actualizacion</li>
<li>Ejecuta <code>updateShipment()</code> con la nueva direccion</li>
<li>Crea o actualiza la direccion en la base de datos del child mediante el Address Service</li>
</ul>

<div class="callout warning">
<strong>Importante:</strong> La verificacion de parentOrg es un mecanismo de seguridad critico. Previene que organizaciones no autorizadas modifiquen direcciones de envios que no les pertenecen.
</div>

<h2>Origenes de la Actualizacion de Direccion</h2>
<p>Existen tres formas en que se puede originar una actualizacion de direccion:</p>

<table>
<tr><th>Origen</th><th>Descripcion</th><th>Detalles</th></tr>
<tr><td><strong>Actualizacion directa</strong></td><td>Un usuario edita la direccion desde el panel de administracion</td><td>El operador corrige manualmente la direccion del envio</td></tr>
<tr><td><strong>Resolucion de NMI</strong></td><td>Correccion de una direccion incorrecta detectada por un issue NMI (Needs More Information)</td><td>Parte del flujo de gestion de incidencias del envio</td></tr>
<tr><td><strong>Link publico</strong></td><td>El destinatario actualiza la direccion a traves de un enlace con token</td><td>El token expira en 24 horas. Permite al destinatario corregir su propia direccion</td></tr>
</table>

<h2>Resumen</h2>
<ul>
<li>La replicacion de direcciones es <strong>unidireccional</strong>: siempre del parent al child</li>
<li>El parent tiene autoridad sobre la direccion del envio</li>
<li>El flujo usa Cloud Tasks con la tarea <code>UPDATESHIPMENT</code></li>
<li>Se verifica <code>parentOrg</code> como medida de seguridad</li>
<li>Las direcciones pueden actualizarse por edicion directa, resolucion de NMI, o link publico (token 24h)</li>
</ul>
`,
    test: {
      questions: [
        {
          id: 'c3l4q1',
          question: 'En que direccion fluye la replicacion de direcciones?',
          options: [
            { id: 'a', text: 'Del child al parent (de abajo hacia arriba)', explanation: 'Esa es la direccion de la replicacion de estados, no de direcciones. La replicacion de direcciones fluye del parent al child porque el parent tiene autoridad sobre la direccion del envio.' },
            { id: 'b', text: 'En ambas direcciones simultaneamente', explanation: 'La replicacion de direcciones es unidireccional, del parent al child. El parent es quien origino el envio y tiene la autoridad para corregir o actualizar la direccion.' },
            { id: 'c', text: 'Del parent al child (de arriba hacia abajo)' },
            { id: 'd', text: 'Solo dentro de la misma organizacion', explanation: 'Las direcciones se replican entre organizaciones diferentes. El parent actualiza la direccion y esta se propaga al child (vendor) que ejecuta la operacion.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c3l4q2',
          question: 'Que verificacion de seguridad se realiza antes de actualizar la direccion en el child?',
          options: [
            { id: 'a', text: 'Se verifica que el usuario tenga permisos de administrador', explanation: 'La verificacion no es a nivel de usuario. Se verifica que el parentOrg del envio coincida con la organizacion que envio la actualizacion, para prevenir modificaciones no autorizadas.' },
            { id: 'b', text: 'Se verifica que el parentOrg del envio coincida con la organizacion que envio la actualizacion' },
            { id: 'c', text: 'Se verifica que la direccion tenga coordenadas GPS validas', explanation: 'La validacion de coordenadas GPS es parte del geocoding, no de la verificacion de seguridad. La verificacion critica es que el parentOrg coincida con quien envio la actualizacion.' },
            { id: 'd', text: 'Se verifica que el envio no este en estado terminal', explanation: 'La verificacion de estado terminal no es el mecanismo de seguridad mencionado. Lo critico es verificar que el parentOrg del envio coincida con la organizacion que envio la actualizacion.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c3l4q3',
          question: 'Cuanto tiempo es valido el token del link publico para actualizacion de direccion?',
          options: [
            { id: 'a', text: '12 horas', explanation: 'El token no expira a las 12 horas. Su validez es de 24 horas, dando al destinatario un dia completo para corregir su direccion.' },
            { id: 'b', text: '48 horas', explanation: 'El token no dura 48 horas. Expira a las 24 horas de su generacion, despues de lo cual el destinatario ya no puede usarlo.' },
            { id: 'c', text: '24 horas' },
            { id: 'd', text: '7 dias', explanation: 'El token no tiene una validez de 7 dias. Expira a las 24 horas para limitar la ventana de modificacion de la direccion por seguridad.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c3l4q5',
          question: 'Que tipo de tarea se encola en Cloud Tasks para replicar una direccion?',
          options: [
            { id: 'a', text: 'REPLICATEADDRESS', explanation: 'No existe un tipo de tarea REPLICATEADDRESS. La replicacion de direcciones usa la tarea UPDATESHIPMENT, que contiene la nueva direccion junto con los datos actualizados del envio.' },
            { id: 'b', text: 'SYNCADDRESSUPDATE', explanation: 'SYNCADDRESSUPDATE no es un tipo de tarea valido en SYNC. La tarea correcta es UPDATESHIPMENT, que incluye la nueva direccion y los datos del envio.' },
            { id: 'c', text: 'UPDATESHIPMENT' },
            { id: 'd', text: 'ADDRESSREPLICATION', explanation: 'ADDRESSREPLICATION no existe como tipo de tarea. Se usa UPDATESHIPMENT porque la actualizacion de direccion se trata como una actualizacion general del envio.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c3l4q6',
          question: 'Que es un NMI en el contexto de actualizacion de direcciones?',
          options: [
            { id: 'a', text: 'Un tipo de nodo en Neo4j para direcciones internacionales', explanation: 'NMI no es un tipo de nodo en Neo4j. Es una incidencia (Needs More Information) que se genera cuando un envio necesita informacion adicional, como una correccion de direccion.' },
            { id: 'b', text: 'Una incidencia de tipo Needs More Information que puede requerir correccion de direccion' },
            { id: 'c', text: 'Un servicio de geocoding para normalizar direcciones', explanation: 'NMI no es un servicio de geocoding. Es un tipo de issue (Needs More Information) que indica que el envio requiere informacion adicional, y una de sus resoluciones puede ser corregir la direccion.' },
            { id: 'd', text: 'Un formato de direccion estandarizado del sistema', explanation: 'NMI no es un formato de direccion. Significa Needs More Information y es un tipo de incidencia del envio que puede desencadenar una actualizacion de direccion como parte de su resolucion.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c3l4q7',
          question: 'Que funcion procesa la tarea de actualizacion en la organizacion child?',
          options: [
            { id: 'a', text: 'replicateAddress()', explanation: 'replicateAddress() no es el nombre correcto. La funcion que procesa las tareas de actualizacion en el child es updateFromTaskManager(), que verifica parentOrg y ejecuta la actualizacion.' },
            { id: 'b', text: 'processChildUpdate()', explanation: 'processChildUpdate() no existe en SYNC. La funcion correcta es updateFromTaskManager(), que recibe la tarea de Cloud Tasks y procesa la actualizacion.' },
            { id: 'c', text: 'updateFromTaskManager()' },
            { id: 'd', text: 'handleAddressReplication()', explanation: 'handleAddressReplication() no es una funcion de SYNC. La funcion que procesa estas tareas en el child es updateFromTaskManager(), que busca el envio por trackingNumber y verifica parentOrg.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c3l4q8',
          question: 'Por que el parent tiene autoridad sobre la direccion del envio y no el child?',
          options: [
            { id: 'a', text: 'Porque el parent es quien origino el envio y tiene la informacion original del destinatario' },
            { id: 'b', text: 'Porque el child no tiene acceso a servicios de geocoding', explanation: 'El child si tiene acceso a servicios de geocoding. La razon es que el parent origino el envio y posee la informacion original del destinatario, no una limitacion tecnica del child.' },
            { id: 'c', text: 'Porque las reglas de negocio impiden que los vendors modifiquen datos', explanation: 'Los vendors pueden modificar datos dentro de su operacion (estados, etc.). La autoridad sobre la direccion es del parent porque es quien origino el envio y tiene la relacion con el destinatario.' },
            { id: 'd', text: 'Porque la base de datos del child es de solo lectura', explanation: 'La base de datos del child no es de solo lectura; el child actualiza estados y otros datos constantemente. La autoridad del parent sobre la direccion se debe a que origino el envio.' }
          ],
          correctOptionId: 'a'
        }
      ]
    }
  },
  // LESSON 5
  {
    title: 'Journeys de Warehouse (WHV1)',
    order: 5,
    content: `
<h2>Que es un Journey de Warehouse</h2>
<p>Un journey define el <strong>conjunto de estados y transiciones posibles</strong> que un envio puede atravesar dentro de un nodo especifico. El journey <strong>WHV1</strong> (Warehouse Version 1) gobierna el ciclo de vida de los envios dentro de centros de distribucion y sorting centers.</p>

<div class="callout">
<strong>Concepto clave:</strong> Cada vez que un envio ingresa a un nodo tipo warehouse, su estado se reinicia dentro del journey WHV1. Los estados del journey anterior (por ejemplo, last-mile) no aplican en este nuevo contexto.
</div>

<h2>Estados del Journey WHV1</h2>
<p>El journey WHV1 contiene los siguientes estados, cada uno representando una etapa del procesamiento en warehouse:</p>

<table>
<tr><th>Estado</th><th>Descripcion</th><th>Tipo</th></tr>
<tr><td><code>order_received</code></td><td>Estado inicial cuando el envio ingresa al warehouse. Indica que el paquete ha sido registrado en el sistema.</td><td>Inicial</td></tr>
<tr><td><code>warehouse</code></td><td>El paquete ha sido escaneado fisicamente en el centro de distribucion. Confirma presencia fisica.</td><td>Intermedio</td></tr>
<tr><td><code>dispatched</code></td><td>El paquete ha sido movido al siguiente nodo en la ruta. Sale del warehouse actual.</td><td>Terminal (exitoso)</td></tr>
<tr><td><code>pre_rts</code></td><td>Primera fase del flujo de retorno al remitente (Return to Sender). El paquete esta marcado para devolucion pero aun no ha sido procesado.</td><td>Intermedio</td></tr>
<tr><td><code>rts</code></td><td>Segunda fase del retorno. El paquete ha sido procesado y esta listo para ser devuelto al remitente.</td><td>Intermedio</td></tr>
<tr><td><code>scanned_into_pallet</code></td><td>El paquete ha sido escaneado y colocado en un pallet para transporte middle-mile. Inicio del flujo de paletizacion.</td><td>Intermedio</td></tr>
<tr><td><code>scanned_out_mm</code></td><td>El paquete ha sido escaneado al salir del pallet en el destino middle-mile. Fin del flujo de paletizacion.</td><td>Intermedio</td></tr>
<tr><td><code>lost</code></td><td>El paquete se ha extraviado dentro del warehouse. Estado terminal de fallo.</td><td>Terminal (fallo)</td></tr>
<tr><td><code>not_delivered</code></td><td>El paquete no pudo ser entregado. Estado terminal de fallo.</td><td>Terminal (fallo)</td></tr>
<tr><td><code>never_received</code></td><td>El paquete fue registrado pero nunca llego fisicamente al warehouse. Estado terminal de fallo.</td><td>Terminal (fallo)</td></tr>
</table>

<h2>Transiciones Permitidas</h2>
<p>No todos los estados pueden transicionar a cualquier otro estado. Las transiciones permitidas en WHV1 son:</p>

<pre><code>order_received --> warehouse --> dispatched
order_received --> lost
order_received --> not_delivered
order_received --> never_received
warehouse --> pre_rts --> rts
warehouse --> scanned_into_pallet --> scanned_out_mm
warehouse --> lost
pre_rts --> lost
scanned_into_pallet --> lost
dispatched --> lost
rts --> lost
scanned_out_mm --> lost</code></pre>

<div class="callout warning">
<strong>Importante:</strong> Los estados <code>lost</code>, <code>not_delivered</code> y <code>never_received</code> son <strong>terminales</strong>: una vez que un envio entra en alguno de estos estados, no puede transicionar a ningun otro estado. El estado <code>dispatched</code> tambien es terminal desde la perspectiva del warehouse actual, ya que el envio pasa al siguiente nodo.
</div>

<h2>Flujos Principales</h2>

<h3>Flujo Normal (Happy Path)</h3>
<p><code>order_received</code> → <code>warehouse</code> → <code>dispatched</code></p>
<p>El paquete llega, se escanea, y se despacha al siguiente nodo de la ruta.</p>

<h3>Flujo de Retorno al Remitente (RTS)</h3>
<p><code>order_received</code> → <code>warehouse</code> → <code>pre_rts</code> → <code>rts</code></p>
<p>El paquete se marca para devolucion en dos fases: primero <code>pre_rts</code> (marcado) y luego <code>rts</code> (procesado). Este flujo de dos fases permite un punto de control antes de confirmar la devolucion.</p>

<h3>Flujo de Paletizacion (Middle-Mile)</h3>
<p><code>order_received</code> → <code>warehouse</code> → <code>scanned_into_pallet</code> → <code>scanned_out_mm</code></p>
<p>El paquete se escanea al entrar en un pallet para transporte middle-mile, y luego se escanea al salir del pallet en el destino. Este flujo es especifico para operaciones de consolidacion y transporte entre centros.</p>

<h2>Resumen</h2>
<ul>
<li>WHV1 gobierna el ciclo de vida de envios en warehouses</li>
<li>El estado inicial siempre es <code>order_received</code></li>
<li>El flujo normal es: <code>order_received</code> --> <code>warehouse</code> --> <code>dispatched</code></li>
<li>El RTS tiene dos fases: <code>pre_rts</code> y <code>rts</code></li>
<li>La paletizacion usa: <code>scanned_into_pallet</code> --> <code>scanned_out_mm</code></li>
<li>Estados terminales de fallo: <code>lost</code>, <code>not_delivered</code>, <code>never_received</code></li>
<li><code>dispatched</code> es terminal exitoso (el envio pasa al siguiente nodo)</li>
</ul>
`,
    test: {
      questions: [
        {
          id: 'c3l5q1',
          question: 'Cual es el estado inicial de un envio cuando ingresa al journey WHV1?',
          options: [
            { id: 'a', text: 'warehouse', explanation: 'El estado warehouse no es el inicial. Es el estado al que se transiciona despues de order_received, cuando el paquete ha sido escaneado fisicamente en el centro de distribucion.' },
            { id: 'b', text: 'order_received' },
            { id: 'c', text: 'pending', explanation: 'El estado pending no existe en el journey WHV1. El estado inicial es order_received, que indica que el envio ha sido registrado en el sistema.' },
            { id: 'd', text: 'scanned', explanation: 'El estado scanned no existe en WHV1. El estado inicial es order_received, y el escaneo fisico se representa con la transicion al estado warehouse.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c3l5q2',
          question: 'Cual es el flujo normal (happy path) de un envio en un warehouse?',
          options: [
            { id: 'a', text: 'order_received --> dispatched --> warehouse', explanation: 'El orden es incorrecto. El paquete no puede ser despachado antes de pasar por warehouse. Primero se registra, luego se escanea fisicamente, y finalmente se despacha.' },
            { id: 'b', text: 'warehouse --> order_received --> dispatched', explanation: 'El orden esta invertido. El estado warehouse viene despues de order_received, no antes. El flujo correcto comienza con el registro (order_received).' },
            { id: 'c', text: 'order_received --> warehouse --> dispatched' },
            { id: 'd', text: 'order_received --> scanned_into_pallet --> dispatched', explanation: 'Este no es el happy path. scanned_into_pallet es parte del flujo de paletizacion (middle-mile), no del flujo normal. El happy path pasa por warehouse antes de dispatched.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c3l5q3',
          question: 'Por que el flujo de retorno al remitente (RTS) tiene dos fases?',
          options: [
            { id: 'a', text: 'Porque se necesita aprobacion de dos supervisores diferentes', explanation: 'Las dos fases no se deben a aprobaciones de supervisores. pre_rts marca el paquete para devolucion y rts confirma que el pallet se envío de vuelta, creando un punto de control intermedio.' },
            { id: 'b', text: 'El primero indica que el paquete fue marcado para devolucion, el segundo que el pallet fue enviado de vuelta al shipper' },
            { id: 'd', text: 'Porque las regulaciones legales lo exigen', explanation: 'Las dos fases no son un requisito legal. Es una decision de diseno del sistema para tener un punto de control antes de confirmar definitivamente la devolucion del paquete.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c3l5q4',
          question: 'Cuales son los estados terminales de fallo en el journey WHV1?',
          options: [
            { id: 'a', text: 'lost y dispatched', explanation: 'dispatched no es un estado de fallo, es el estado terminal exitoso del warehouse. Ademas faltan not_delivered y never_received que tambien son terminales de fallo.' },
            { id: 'b', text: 'not_delivered y rts', explanation: 'rts no es un estado terminal de fallo, es un estado intermedio del flujo de devolucion. Ademas falta lost y never_received en esta lista.' },
            { id: 'c', text: 'lost, not_delivered y never_received' },
            { id: 'd', text: 'lost, pre_rts y never_received', explanation: 'pre_rts no es un estado terminal, es un estado intermedio que puede transicionar a rts o lost. El estado terminal de fallo correcto que falta es not_delivered.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c3l5q5',
          question: 'Que representa el estado scanned_into_pallet?',
          options: [
            { id: 'a', text: 'El paquete fue escaneado al salir del warehouse', explanation: 'scanned_into_pallet no indica la salida del warehouse. Indica que el paquete fue colocado en un pallet para transporte middle-mile. La salida del pallet se representa con scanned_out_mm.' },
            { id: 'b', text: 'El paquete fue escaneado y colocado en un pallet para transporte middle-mile' },
            { id: 'c', text: 'El paquete fue escaneado al ingresar al warehouse', explanation: 'El escaneo de ingreso al warehouse corresponde a la transicion de order_received a warehouse, no a scanned_into_pallet que es parte del flujo de paletizacion.' },
            { id: 'd', text: 'El paquete fue escaneado para verificar su contenido', explanation: 'scanned_into_pallet no se refiere a verificacion de contenido. Es especificamente el escaneo al colocar el paquete en un pallet para transporte middle-mile entre centros.' }
          ],
          correctOptionId: 'b'
        },
        
        {
          id: 'c3l5q7',
          question: 'Que diferencia hay entre never_received y lost?',
          options: [
            { id: 'a', text: 'Son lo mismo, solo cambia el nombre segun la region', explanation: 'No son lo mismo. never_received indica que el paquete nunca llego fisicamente al warehouse, mientras que lost indica que se extravio despues de haber sido registrado o procesado.' },
            { id: 'b', text: 'never_received significa que nunca llego fisicamente al warehouse; lost significa que se extravio despues de haber sido registrado' },
            { id: 'c', text: 'never_received aplica solo a paquetes internacionales', explanation: 'never_received no tiene restriccion por tipo de paquete. Aplica a cualquier paquete que fue registrado en el sistema pero nunca llego fisicamente al warehouse.' },
            { id: 'd', text: 'lost es temporal y never_received es permanente', explanation: 'Ambos son estados terminales permanentes. La diferencia no es de temporalidad sino de momento: never_received es cuando nunca llego fisicamente, y lost es cuando se extravio despues de haber sido procesado.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c3l5q8',
          question: 'Por que dispatched se considera un estado terminal exitoso?',
          options: [
            { id: 'a', text: 'Porque el paquete fue entregado al destinatario final', explanation: 'dispatched no significa entrega al destinatario final. Indica que el paquete salio del warehouse actual hacia el siguiente nodo de la ruta. La entrega final ocurre en el journey LMV1.' },
            { id: 'b', text: 'Porque el paquete salio del warehouse actual y paso al siguiente nodo de la ruta' },
            { id: 'c', text: 'Porque el cliente confirmo la recepcion del paquete', explanation: 'No hay confirmacion de cliente en el journey WHV1. dispatched es terminal porque el paquete dejo el warehouse actual. La interaccion con el cliente ocurre en el journey de ultima milla (LMV1).' },
            { id: 'd', text: 'Porque el warehouse completo su turno de trabajo', explanation: 'dispatched no tiene relacion con turnos de trabajo. Es terminal porque el paquete salio fisicamente del warehouse y paso al siguiente nodo de la ruta logistica.' }
          ],
          correctOptionId: 'b'
        }
      ]
    }
  },
  // LESSON 6
  {
    title: 'Journeys de Last Mile (LMV1)',
    order: 6,
    content: `
<h2>Que es el Journey de Last Mile</h2>
<p>El journey <strong>LMV1</strong> (Last Mile Version 1) gobierna el ciclo de vida de los envios durante la etapa de <strong>ultima milla</strong>, es decir, desde que el paquete sale del ultimo centro de distribucion hasta que llega al destinatario final. Es el journey donde se produce la interaccion directa con el cliente.</p>

<div class="callout">
<strong>Concepto clave:</strong> Cuando un envio llega a un nodo de tipo last-mile, su estado se <strong>reinicia a <code>order_received</code></strong> dentro del journey LMV1. Los estados del journey anterior (WHV1) ya no aplican en este nuevo contexto.
</div>

<h2>Estados del Journey LMV1</h2>
<table>
<tr><th>Estado</th><th>Descripcion</th><th>Tipo</th></tr>
<tr><td><code>order_received</code></td><td>Estado inicial. El envio ha llegado al nodo de ultima milla y esta registrado en el sistema, listo para ser asignado a un conductor.</td><td>Inicial</td></tr>
<tr><td><code>out_for_delivery</code></td><td>El conductor ha salido con el paquete hacia la direccion del destinatario. El envio esta activamente en ruta de entrega.</td><td>Intermedio</td></tr>
<tr><td><code>delivered</code></td><td>El paquete fue entregado exitosamente al destinatario. Se registra proof of delivery (POD).</td><td>Terminal (exitoso)</td></tr>
<tr><td><code>failed_delivery_attempt</code></td><td>El intento de entrega fallo. El conductor no pudo entregar el paquete (destinatario ausente, direccion incorrecta, etc.).</td><td>Intermedio</td></tr>
<tr><td><code>not_delivered</code></td><td>Se determino que el paquete no puede ser entregado. Cierre definitivo tras intentos fallidos.</td><td>Terminal (fallo)</td></tr>
<tr><td><code>lost</code></td><td>El paquete se extravio durante la operacion de ultima milla.</td><td>Terminal (fallo)</td></tr>
<tr><td><code>never_received</code></td><td>El paquete nunca llego fisicamente al nodo de ultima milla. Registrado en sistema pero sin presencia fisica.</td><td>Terminal (fallo)</td></tr>
</table>

<h2>Transiciones Permitidas</h2>
<p>No todos los estados pueden transicionar a cualquier otro estado. Las transiciones permitidas en LMV1 son:</p>

<pre><code>order_received --> out_for_delivery --> delivered
out_for_delivery --> failed_delivery_attempt --> not_delivered
failed_delivery_attempt --> out_for_delivery
order_received --> lost
order_received --> never_received
out_for_delivery --> lost
failed_delivery_attempt --> lost</code></pre>

<div class="callout">
<strong>Nota sobre reintentos:</strong> La transicion de <code>failed_delivery_attempt</code> a <code>out_for_delivery</code> permite ciclos de reintento. Un paquete puede fallar multiples veces antes de ser finalmente entregado o cerrado como <code>not_delivered</code>. Cada intento queda registrado en el historial del envio.
</div>

<h2>Flujos Principales</h2>

<h3>Flujo Normal (Happy Path)</h3>
<p><code>order_received</code> → <code>out_for_delivery</code> → <code>delivered</code></p>
<p>El paquete llega al nodo, el conductor sale a entregarlo, y la entrega es exitosa.</p>

<h3>Flujo con Reintento</h3>
<p><code>order_received</code> → <code>out_for_delivery</code> → <code>failed_delivery_attempt</code> → <code>out_for_delivery</code> → <code>delivered</code></p>
<p>El primer intento falla, pero el paquete se vuelve a asignar a ruta y se entrega en el segundo intento.</p>

<h3>Flujo de Fallo Definitivo</h3>
<p><code>order_received</code> → <code>out_for_delivery</code> → <code>failed_delivery_attempt</code> → <code>not_delivered</code></p>
<p>El intento falla y se determina que no se realizaran mas intentos.</p>

<h2>Registro de Historial de Estados</h2>
<p>Cada cambio de estado en el journey LMV1 se registra en el array <code>history</code> del envio. Cada entrada del historial contiene:</p>

<table>
<tr><th>Campo</th><th>Descripcion</th></tr>
<tr><td><strong>timestamp</strong></td><td>Fecha y hora exacta del cambio de estado</td></tr>
<tr><td><strong>user</strong></td><td>Informacion del usuario que realizo el cambio: nombre, email e ID</td></tr>
<tr><td><strong>sourceType</strong></td><td>Origen del cambio (app movil, panel web, API, automatico)</td></tr>
<tr><td><strong>sourceContext</strong></td><td>Contexto adicional sobre el origen (ej: nombre de la ruta, ID del dispositivo)</td></tr>
<tr><td><strong>GPS</strong></td><td>Coordenadas geograficas: latitud, longitud, ciudad y estado/provincia</td></tr>
<tr><td><strong>images</strong></td><td>Fotografias asociadas al cambio (ej: foto de POD en entrega, foto de direccion incorrecta en fallo)</td></tr>
<tr><td><strong>metadata</strong></td><td>Datos adicionales especificos del estado (ej: motivo de fallo, firma digital)</td></tr>
</table>

<h2>Funcionalidades Adicionales del Envio</h2>
<p>Ademas del journey de estados, los envios en la etapa de ultima milla cuentan con funcionalidades complementarias:</p>

<h3>Prioridad</h3>
<p>Los envios pueden tener una <strong>prioridad asignada</strong> que afecta el orden en que los conductores los entregan. Los envios de alta prioridad se procesan primero en la ruta.</p>

<h3>Bloqueo</h3>
<p>Los envios pueden ser <strong>bloqueados</strong> por diversas razones (problema con la direccion, paquete danado, disputa comercial, etc.). Un envio bloqueado no puede avanzar en el journey hasta que se resuelva la razon del bloqueo.</p>

<h3>Tracking Publico</h3>
<p>Para cada envio se genera una <strong>URL corta de tracking publico</strong>. Esta URL permite al destinatario consultar el estado de su envio sin necesidad de autenticarse en el sistema. El nivel de detalle visible se controla mediante <code>visibilityLevel</code>:</p>
<ul>
<li>Un nivel bajo muestra solo estados generales (en transito, entregado)</li>
<li>Un nivel alto muestra detalles completos incluyendo ubicacion del conductor y hora estimada</li>
</ul>

<div class="callout warning">
<strong>Importante:</strong> El <code>visibilityLevel</code> del tracking publico se configura a nivel de organizacion, no por envio individual. Esto garantiza consistencia en la experiencia del cliente final para todos los envios de una misma organizacion.
</div>

<h2>Comparacion WHV1 vs LMV1</h2>
<table>
<tr><th>Aspecto</th><th>WHV1 (Warehouse)</th><th>LMV1 (Last Mile)</th></tr>
<tr><td>Proposito</td><td>Procesamiento en centro de distribucion</td><td>Entrega al destinatario final</td></tr>
<tr><td>Estado inicial</td><td><code>order_received</code></td><td><code>order_received</code></td></tr>
<tr><td>Estado exitoso terminal</td><td><code>dispatched</code></td><td><code>delivered</code></td></tr>
<tr><td>Permite reintentos</td><td>No</td><td>Si (via <code>failed_delivery_attempt</code>)</td></tr>
<tr><td>Flujo de paletizacion</td><td>Si</td><td>No</td></tr>
<tr><td>Flujo RTS</td><td>Si (dos fases)</td><td>No</td></tr>
<tr><td>Interaccion con cliente</td><td>No</td><td>Si (entrega, POD, tracking)</td></tr>
</table>

<h2>Resumen</h2>
<ul>
<li>LMV1 gobierna la etapa de ultima milla hasta la entrega al destinatario</li>
<li>El envio se reinicia a <code>order_received</code> al entrar al nodo de last-mile</li>
<li>Flujo normal: <code>order_received</code> --> <code>out_for_delivery</code> --> <code>delivered</code></li>
<li>Permite reintentos: <code>failed_delivery_attempt</code> puede volver a <code>out_for_delivery</code></li>
<li>Estados terminales: <code>delivered</code> (exitoso), <code>lost</code>, <code>not_delivered</code>, <code>never_received</code> (fallo)</li>
<li>Cada cambio de estado registra timestamp, usuario, GPS, imagenes y metadata en el historial</li>
<li>Funcionalidades adicionales: prioridad, bloqueo y tracking publico con <code>visibilityLevel</code></li>
</ul>
`,
    test: {
      questions: [
        {
          id: 'c3l6q1',
          question: 'Que ocurre con el estado del envio cuando llega a un nodo de last-mile?',
          options: [
            { id: 'a', text: 'Continua con el estado que tenia en el warehouse anterior', explanation: 'Los estados del journey anterior (WHV1) no se mantienen. Al entrar a un nodo de last-mile, el estado se reinicia a order_received dentro del nuevo journey LMV1.' },
            { id: 'b', text: 'Se reinicia a order_received dentro del journey LMV1' },
            { id: 'c', text: 'Pasa automaticamente a out_for_delivery', explanation: 'No pasa directamente a out_for_delivery. Primero se reinicia a order_received, que indica que el envio esta registrado y listo para ser asignado a un conductor.' },
            { id: 'd', text: 'Se mantiene en dispatched hasta que un conductor lo tome', explanation: 'dispatched es un estado del journey WHV1. Al llegar al nodo de last-mile, el estado se reinicia a order_received dentro del journey LMV1, no se mantiene el estado anterior.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c3l6q2',
          question: 'Cual es el flujo normal (happy path) en el journey LMV1?',
          options: [
            { id: 'a', text: 'order_received --> delivered', explanation: 'Falta el paso intermedio out_for_delivery. No se puede pasar directamente de order_received a delivered; primero el conductor debe salir con el paquete a ruta.' },
            { id: 'b', text: 'out_for_delivery --> delivered --> confirmed', explanation: 'Falta el estado inicial order_received, y el estado confirmed no existe en el journey LMV1. El flujo comienza con order_received y termina en delivered.' },
            { id: 'c', text: 'order_received --> out_for_delivery --> delivered' },
            { id: 'd', text: 'warehouse --> out_for_delivery --> delivered', explanation: 'El estado warehouse pertenece al journey WHV1, no a LMV1. En last-mile el estado inicial es order_received, no warehouse.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c3l6q3',
          question: 'Que permite la transicion de failed_delivery_attempt a out_for_delivery?',
          options: [
            { id: 'a', text: 'Cancelar el intento fallido como si nunca hubiera ocurrido', explanation: 'El intento fallido no se cancela ni se borra. Queda registrado en el historial del envio. La transicion permite un nuevo intento de entrega manteniendo el registro previo.' },
            { id: 'b', text: 'Realizar un reintento de entrega del paquete' },
            { id: 'c', text: 'Devolver el paquete al warehouse para reprocesamiento', explanation: 'Esta transicion no devuelve el paquete al warehouse. Permite que el paquete vuelva a salir a ruta de entrega dentro del mismo journey LMV1.' },
            { id: 'd', text: 'Asignar el paquete a un conductor diferente automaticamente', explanation: 'La transicion no asigna automaticamente un conductor diferente. Permite un reintento de entrega, pero la asignacion de conductor es un proceso independiente de la transicion de estados.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c3l6q4',
          question: 'Que informacion se registra en cada entrada del historial de estados?',
          options: [
            { id: 'a', text: 'Solo el timestamp y el nuevo estado', explanation: 'El historial registra mucho mas que timestamp y estado. Incluye tambien usuario, sourceType, sourceContext, GPS, imagenes y metadata para trazabilidad completa.' },
            { id: 'b', text: 'Timestamp, usuario, sourceType, sourceContext, GPS, imagenes y metadata' },
            { id: 'c', text: 'Solo el estado anterior y el nuevo estado', explanation: 'El historial es mucho mas detallado. Cada entrada incluye timestamp, informacion del usuario, origen del cambio, coordenadas GPS, imagenes y metadata adicional.' },
            { id: 'd', text: 'Timestamp, estado y motivo de cambio', explanation: 'Faltan varios campos importantes como usuario, sourceType, sourceContext, GPS e imagenes. El historial registra informacion completa para permitir trazabilidad total.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c3l6q5',
          question: 'Que controla el campo visibilityLevel en el tracking publico?',
          options: [
            { id: 'a', text: 'Si el tracking publico esta activado o desactivado', explanation: 'visibilityLevel no activa ni desactiva el tracking. Controla el nivel de detalle que se muestra al destinatario, desde estados generales hasta informacion detallada del conductor.' },
            { id: 'b', text: 'Cuantas personas pueden ver el tracking simultaneamente', explanation: 'visibilityLevel no limita la cantidad de personas. Controla que tan detallada es la informacion visible en la URL de tracking, no quien puede acceder.' },
            { id: 'c', text: 'El nivel de detalle visible para el destinatario en la URL de tracking' },
            { id: 'd', text: 'El tiempo durante el cual el link de tracking permanece activo', explanation: 'visibilityLevel no controla la duracion del link. Define el nivel de detalle mostrado: un nivel bajo muestra estados generales y un nivel alto incluye ubicacion del conductor y hora estimada.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c3l6q7',
          question: 'Que significa que un envio este "bloqueado"?',
          options: [
            { id: 'a', text: 'Que el conductor no puede ver la informacion del envio', explanation: 'El bloqueo no afecta la visibilidad del conductor. Significa que el envio no puede avanzar en el journey hasta que se resuelva la razon del bloqueo (direccion incorrecta, paquete danado, etc.).' },
            { id: 'b', text: 'Que el envio no puede avanzar en el journey hasta que se resuelva la razon del bloqueo' },
            { id: 'c', text: 'Que el tracking publico ha sido desactivado para ese envio', explanation: 'El bloqueo no desactiva el tracking publico. Impide que el envio avance en el journey de estados hasta que se resuelva el motivo del bloqueo.' },
            { id: 'd', text: 'Que el envio ha sido marcado como perdido automaticamente', explanation: 'Un envio bloqueado no se marca como perdido. El bloqueo es una pausa temporal que impide avanzar en el journey hasta resolver la causa (problema de direccion, paquete danado, etc.).' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c3l6q8',
          question: 'Cual es el estado terminal exitoso en el journey LMV1?',
          options: [
            { id: 'a', text: 'dispatched', explanation: 'dispatched es el estado terminal exitoso del journey WHV1 (warehouse), no de LMV1. En last-mile, el estado terminal exitoso es delivered.' },
            { id: 'b', text: 'out_for_delivery', explanation: 'out_for_delivery es un estado intermedio que indica que el conductor salio con el paquete. No es terminal porque puede transicionar a delivered, failed_delivery_attempt o lost.' },
            { id: 'c', text: 'delivered' },
            { id: 'd', text: 'completed', explanation: 'El estado completed no existe en el journey LMV1. El estado terminal exitoso se llama delivered, que indica que el paquete fue entregado al destinatario con proof of delivery.' }
          ],
          correctOptionId: 'c'
        }
      ]
    }
  }
];
