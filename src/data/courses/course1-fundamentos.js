export const course1Data = {
  title: 'Fundamentos de SyncFreight',
  description: 'Curso introductorio que cubre los conceptos fundamentales de la plataforma SyncFreight: que es el sistema, sus actores principales, la arquitectura tecnologica y el modelo de multi-tenencia.',
  order: 1,
  published: true,
  totalLessons: 4
};

export const course1Lessons = [
  {
    title: 'Que es SyncFreight',
    order: 1,
    content: `
      <h2>Introduccion a SyncFreight</h2>
      <p>
        SYNC es un <strong>sistema de gestion logistica y envios</strong> disenado para operaciones de
        ultima milla (last-mile), middle-mile y almacen. Permite a organizaciones logisticas gestionar
        todo el ciclo de vida de un envio, desde la recepcion en almacen hasta la entrega final al destinatario.
      </p>

      <h3>Tipos de Operaciones</h3>
      <p>La plataforma soporta tres tipos principales de operaciones logisticas:</p>
      <table>
        <thead>
          <tr>
            <th>Tipo de Operacion</th>
            <th>Descripcion</th>
            <th>Ejemplo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Last-mile</strong></td>
            <td>Entrega final al destinatario. Es el ultimo tramo del envio, desde el centro de distribucion hasta la puerta del cliente.</td>
            <td>Un driver recoge paquetes del warehouse y los entrega en domicilios residenciales.</td>
          </tr>
          <tr>
            <td><strong>Middle-mile</strong></td>
            <td>Transporte entre warehouses o centros de distribucion. Conecta nodos intermedios de la red logistica.</td>
            <td>Un camion transporta carga consolidada desde un warehouse central a un warehouse regional.</td>
          </tr>
          <tr>
            <td><strong>Warehouse</strong></td>
            <td>Recepcion, escaneo, clasificacion y despacho de envios dentro de un centro de distribucion.</td>
            <td>Personal del almacen recibe paquetes, los escanea, clasifica por ruta y los prepara para despacho.</td>
          </tr>
        </tbody>
      </table>

      <div class="callout">
        <strong>Concepto clave:</strong> SyncFreight gestiona el ciclo de vida completo de un envio.
        Desde que un paquete llega al almacen (warehouse), pasando por su clasificacion y posible
        transporte intermedio (middle-mile), hasta su entrega final al destinatario (last-mile).
      </div>

      <h3>Componentes de la Plataforma</h3>
      <p>SyncFreight esta compuesto por varios componentes que trabajan en conjunto:</p>
      <ul>
        <li>
          <strong>Backend API (NestJS):</strong> Contiene toda la logica de negocio del sistema.
          Expone APIs REST para que los demas componentes interactuen con los datos. Tambien utiliza
          WebSockets para comunicacion en tiempo real. La version actual de la API es la <strong>v6</strong>.
        </li>
        <li>
          <strong>Frontend Web (Angular 16):</strong> Es el panel de administracion web utilizado por
          operadores, personal de almacen (warehouse staff) y administradores. Permite gestionar envios,
          rutas, usuarios, warehouses y toda la configuracion del sistema.
        </li>
        <li>
          <strong>App Movil - SyncPod:</strong> Aplicacion movil disenada para los drivers (conductores).
          Permite realizar tracking GPS en tiempo real, capturar pruebas de entrega (POD - Proof of Delivery)
          y escanear codigos de barras de los paquetes.
        </li>
        <li>
          <strong>API v6:</strong> La version actual de la interfaz de programacion. Es el punto de
          integracion principal para sistemas externos y para los propios componentes de la plataforma.
        </li>
      </ul>

      <h3>Flujo General de un Envio</h3>
      <p>Un envio tipico en SyncFreight sigue este flujo:</p>
      <ol>
        <li><strong>Recepcion:</strong> El paquete llega al warehouse y es registrado en el sistema.</li>
        <li><strong>Escaneo y clasificacion:</strong> Se escanea el codigo de barras y se clasifica segun la ruta de destino.</li>
        <li><strong>Despacho:</strong> Los paquetes se agrupan por ruta y se asignan a un driver o vehiculo.</li>
        <li><strong>Transporte (middle-mile):</strong> Si es necesario, el paquete se transporta a otro warehouse mas cercano al destino.</li>
        <li><strong>Entrega (last-mile):</strong> El driver realiza la entrega final, captura la prueba de entrega (POD) y el sistema actualiza el estado.</li>
      </ol>

      <div class="callout warning">
        <strong>Importante:</strong> No todas las operaciones requieren middle-mile. Muchos envios van
        directamente del warehouse de origen a la entrega last-mile, sin pasar por centros de
        distribucion intermedios.
      </div>
    `,
    test: {
      questions: [
        {
          id: 'c1l1q1',
          question: 'Que es SyncFreight?',
          options: [
            { id: 'a', text: 'Un sistema de gestion logistica y envios para operaciones last-mile, middle-mile y warehouse' },
            { id: 'b', text: 'Una aplicacion movil exclusivamente para conductores de reparto', explanation: 'SyncPod es la app movil para drivers, pero SyncFreight es mucho mas que eso: es una plataforma integral que abarca logistica last-mile, middle-mile y warehouse.' },
            { id: 'c', text: 'Un sistema de contabilidad para empresas de transporte', explanation: 'SyncFreight no es un sistema contable. Su funcion es gestionar operaciones logisticas y envios, no la contabilidad de las empresas.' },
            { id: 'd', text: 'Una plataforma de comercio electronico para venta de productos', explanation: 'SyncFreight no vende productos ni es una plataforma de e-commerce. Se enfoca en la gestion logistica del transporte y entrega de envios.' }
          ],
          correctOptionId: 'a'
        },
        {
          id: 'c1l1q2',
          question: 'Que tipo de operacion corresponde a la entrega final al destinatario?',
          options: [
            { id: 'a', text: 'Middle-mile', explanation: 'Middle-mile se refiere al transporte entre warehouses o centros de distribucion, no a la entrega final al cliente.' },
            { id: 'b', text: 'Warehouse', explanation: 'Las operaciones de warehouse cubren recepcion, escaneo y clasificacion dentro del almacen, no la entrega al destinatario.' },
            { id: 'c', text: 'Last-mile' },
            { id: 'd', text: 'First-mile', explanation: 'First-mile no es un tipo de operacion definido en SyncFreight. La entrega final se denomina last-mile.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c1l1q3',
          question: 'Cual es la funcion principal de las operaciones middle-mile?',
          options: [
            { id: 'a', text: 'Entregar paquetes directamente al cliente final', explanation: 'La entrega directa al cliente final corresponde a operaciones last-mile, no middle-mile.' },
            { id: 'b', text: 'Transportar carga entre warehouses o centros de distribucion' },
            { id: 'c', text: 'Escanear y clasificar paquetes en el almacen', explanation: 'El escaneo y clasificacion de paquetes es una actividad de warehouse, no de middle-mile.' },
            { id: 'd', text: 'Registrar nuevos clientes en el sistema', explanation: 'El registro de clientes es una funcion administrativa, no una operacion logistica de middle-mile.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c1l1q4',
          question: 'Que tecnologia utiliza el Backend API de SyncFreight?',
          options: [
            { id: 'a', text: 'Django', explanation: 'Django es un framework de Python. El backend de SyncFreight esta construido con NestJS, un framework de Node.js.' },
            { id: 'b', text: 'Express.js', explanation: 'Aunque Express.js tambien es un framework de Node.js, SyncFreight utiliza NestJS que ofrece una arquitectura mas estructurada.' },
            { id: 'c', text: 'NestJS' },
            { id: 'd', text: 'Spring Boot', explanation: 'Spring Boot es un framework de Java. SyncFreight utiliza NestJS, que esta basado en Node.js.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c1l1q5',
          question: 'Que version de la API es la actualmente utilizada en SyncFreight?',
          options: [
            { id: 'a', text: 'v3', explanation: 'La v3 es una version anterior ya superada. La version actual de la API es la v6.' },
            { id: 'b', text: 'v4', explanation: 'La v4 es una version anterior ya superada. La version actual de la API es la v6.' },
            { id: 'c', text: 'v5', explanation: 'La v5 es una version anterior ya superada. La version actual de la API es la v6.' },
            { id: 'd', text: 'v6' }
          ],
          correctOptionId: 'd'
        },
        {
          id: 'c1l1q6',
          question: 'Para que se utiliza la app movil SyncPod?',
          options: [
            { id: 'a', text: 'Para que los administradores gestionen la configuracion del sistema', explanation: 'Los administradores usan el frontend web (Angular 16) para gestionar la configuracion, no la app SyncPod.' },
            { id: 'b', text: 'Para que los drivers realicen tracking, capturen POD y escaneen codigos de barras' },
            { id: 'c', text: 'Para que los clientes finales rastreen sus paquetes', explanation: 'SyncPod esta disenada para los drivers, no para los clientes finales. Los destinatarios no interactuan con esta app.' },
            { id: 'd', text: 'Para que el personal de warehouse procese devoluciones', explanation: 'El personal de warehouse utiliza el panel web para sus operaciones. SyncPod es exclusivamente para drivers en operaciones de entrega.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c1l1q7',
          question: 'Que actividades se realizan en las operaciones de warehouse?',
          options: [
            { id: 'a', text: 'Recepcion, escaneo, clasificacion y despacho de envios' },
            { id: 'b', text: 'Unicamente almacenamiento de paquetes a largo plazo', explanation: 'El warehouse en SyncFreight no es solo almacenamiento. Incluye procesos activos como escaneo, clasificacion por ruta y despacho de envios.' },
            { id: 'c', text: 'Fabricacion y empaquetado de productos', explanation: 'SyncFreight es un sistema logistico, no de manufactura. Los warehouses procesan envios ya existentes, no fabrican productos.' },
            { id: 'd', text: 'Atencion al cliente y resolucion de reclamos', explanation: 'Las operaciones de warehouse son logisticas (recepcion, escaneo, clasificacion, despacho), no de servicio al cliente.' }
          ],
          correctOptionId: 'a'
        },
        {
          id: 'c1l1q8',
          question: 'Que framework utiliza el Frontend Web de SyncFreight?',
          options: [
            { id: 'a', text: 'React 18', explanation: 'React es una libreria de JavaScript, pero el frontend de SyncFreight (sync-frontend) esta construido con Angular 16.' },
            { id: 'b', text: 'Vue.js 3', explanation: 'Vue.js es un framework progresivo de JavaScript, pero SyncFreight utiliza Angular 16 para su frontend web.' },
            { id: 'c', text: 'Angular 16' },
            { id: 'd', text: 'Svelte', explanation: 'Svelte es un framework de compilacion, pero el frontend de SyncFreight esta construido con Angular 16.' }
          ],
          correctOptionId: 'c'
        }
      ]
    }
  },
  {
    title: 'Actores del Sistema',
    order: 2,
    content: `
      <h2>Actores del Sistema SyncFreight</h2>
      <p>
        SyncFreight involucra multiples actores que interactuan dentro del ecosistema logistico.
        Cada actor cumple un rol especifico y tiene diferentes niveles de acceso y funcionalidad
        dentro de la plataforma.
      </p>

      <h3>Actores Principales</h3>
      <table>
        <thead>
          <tr>
            <th>Actor</th>
            <th>Descripcion</th>
            <th>Funciones Clave</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Organizaciones</strong></td>
            <td>Empresas logisticas que operan dentro de la plataforma. El sistema soporta multi-tenencia: cada organizacion tiene su propia base de datos independiente.</td>
            <td>Gestion completa de envios, rutas, warehouses, drivers y configuracion del sistema.</td>
          </tr>
          <tr>
            <td><strong>Warehouses</strong></td>
            <td>Centros de distribucion donde se reciben, procesan y despachan los envios.</td>
            <td>Recepcion de paquetes, escaneo de codigos de barras, clasificacion por ruta y despacho.</td>
          </tr>
          <tr>
            <td><strong>Drivers</strong></td>
            <td>Conductores empleados directamente por una organizacion logistica.</td>
            <td>Ejecucion de rutas de entrega last-mile, tracking GPS en tiempo real, captura de pruebas de entrega (POD).</td>
          </tr>
          <tr>
            <td><strong>Flex Riders</strong></td>
            <td>Conductores independientes que trabajan bajo demanda, no son empleados fijos.</td>
            <td>Rutas flexibles con precio sugerido, disponibilidad variable, modelo tipo gig-economy.</td>
          </tr>
          <tr>
            <td><strong>Shippers</strong></td>
            <td>Organizaciones externas que envian paquetes. Son quienes generan la carga que debe ser transportada.</td>
            <td>Generacion de ordenes de envio, seguimiento de sus paquetes, integracion con la plataforma.</td>
          </tr>
          <tr>
            <td><strong>Vendors</strong></td>
            <td>Proveedores de servicio externos que complementan las operaciones logisticas.</td>
            <td>Provision de servicios especializados como transporte de larga distancia, almacenamiento adicional, etc.</td>
          </tr>
        </tbody>
      </table>

      <h3>Drivers vs Flex Riders</h3>
      <p>Es importante entender la diferencia entre estos dos tipos de conductores:</p>
      <ul>
        <li>
          <strong>Drivers:</strong> Son empleados directos de la organizacion. Tienen rutas asignadas
          de forma regular, horarios establecidos y estan bajo la gestion completa de la empresa.
          Utilizan la app SyncPod para ejecutar sus entregas.
        </li>
        <li>
          <strong>Flex Riders:</strong> Son conductores independientes que aceptan rutas bajo demanda.
          Funcionan con un modelo similar a la gig-economy. Se les ofrece un <strong>precio sugerido</strong>
          por ruta y tienen la flexibilidad de aceptar o rechazar las asignaciones.
        </li>
      </ul>

      <h3>Organizaciones Internas vs Externas</h3>
      <p>
        SyncFreight distingue entre organizaciones internas y externas. Esta distincion es fundamental
        para entender como se relacionan las diferentes empresas dentro del ecosistema.
      </p>

      <table>
        <thead>
          <tr>
            <th>Caracteristica</th>
            <th>Organizacion Interna</th>
            <th>Organizacion Externa</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Definicion</strong></td>
            <td>Tiene su propia cuenta dentro de SyncFreight</td>
            <td>Utiliza su propio sistema externo (ej: Xcelerator, CXT)</td>
          </tr>
          <tr>
            <td><strong>Acceso</strong></td>
            <td>Accede directamente al panel web y/o API de SYNC</td>
            <td>Se integra a traves de APIs o procesos manuales</td>
          </tr>
          <tr>
            <td><strong>Base de datos</strong></td>
            <td>Tiene su propia BD dentro de la plataforma SYNC</td>
            <td>Sus datos residen en su propio sistema</td>
          </tr>
          <tr>
            <td><strong>Ejemplo</strong></td>
            <td>Una empresa logistica que opera completamente con SYNC</td>
            <td>Un shipper que usa Xcelerator y envia ordenes a SYNC via API</td>
          </tr>
        </tbody>
      </table>

      <h3>Roles de Organizacion</h3>
      <p>Las organizaciones dentro de SyncFreight pueden tener diferentes roles que definen su funcion en la cadena logistica:</p>
      <ul>
        <li>
          <strong>Shipper:</strong> Organizacion que genera la carga. Es quien necesita que sus paquetes
          sean transportados y entregados. Un shipper puede ser interno (con cuenta SYNC) o externo.
        </li>
        <li>
          <strong>Vendor:</strong> Proveedor de servicios logisticos. Ofrece capacidad de transporte,
          almacenamiento u otros servicios complementarios a otras organizaciones.
        </li>
        <li>
          <strong>Service Provider:</strong> Similar al vendor, es un proveedor de servicios especificos
          dentro de la cadena logistica.
        </li>
      </ul>

      <div class="callout">
        <strong>Concepto clave:</strong> La naturaleza interna o externa de una organizacion determina
        como se integra con SyncFreight. Las internas operan directamente en la plataforma, mientras
        que las externas se conectan a traves de integraciones con sus propios sistemas.
      </div>

      <div class="callout warning">
        <strong>Importante:</strong> Los tipos de organizacion (broker, last-mile, warehouse) definen
        que operaciones puede realizar, mientras que los roles (shipper, vendor, serviceProvider)
        definen su relacion con otras organizaciones en la red logistica.
      </div>
    `,
    test: {
      questions: [
        {
          id: 'c1l2q1',
          question: 'Que significa que SyncFreight soporta multi-tenencia a nivel de organizaciones?',
          options: [
            { id: 'a', text: 'Que todas las organizaciones comparten una unica base de datos', explanation: 'Precisamente lo contrario: la multi-tenencia en SyncFreight garantiza que cada organizacion tenga su propia base de datos independiente, no una compartida.' },
            { id: 'b', text: 'Que cada organizacion tiene su propia base de datos independiente' },
            { id: 'c', text: 'Que solo puede existir una organizacion por servidor', explanation: 'La multi-tenencia permite que multiples organizaciones coexistan en la misma plataforma, no se limita a una por servidor.' },
            { id: 'd', text: 'Que las organizaciones deben turnarse para acceder al sistema', explanation: 'Todas las organizaciones acceden al sistema de forma simultanea e independiente. No existe un sistema de turnos.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c1l2q2',
          question: 'Cual es la principal diferencia entre un Driver y un Flex Rider?',
          options: [
            { id: 'a', text: 'Los Drivers usan vehiculos mas grandes que los Flex Riders', explanation: 'La diferencia no es el tamano del vehiculo. La distincion es laboral: los Drivers son empleados directos y los Flex Riders son independientes bajo demanda.' },
            { id: 'b', text: 'Los Drivers son empleados directos y los Flex Riders son conductores independientes bajo demanda' },
            { id: 'c', text: 'Los Flex Riders solo trabajan en middle-mile', explanation: 'Los Flex Riders realizan entregas last-mile bajo demanda. No estan restringidos a operaciones middle-mile.' },
            { id: 'd', text: 'Los Drivers no usan la app movil, solo los Flex Riders', explanation: 'Los Drivers tambien usan la app SyncPod para ejecutar sus entregas, tracking GPS y captura de POD.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c1l2q3',
          question: 'Que caracteriza a una organizacion externa en SyncFreight?',
          options: [
            { id: 'a', text: 'Tiene su propia cuenta y base de datos dentro de SYNC', explanation: 'Eso describe a una organizacion interna. Las externas no tienen cuenta propia dentro de SYNC, sino que usan sus propios sistemas.' },
            { id: 'b', text: 'No puede interactuar con el sistema de ninguna forma', explanation: 'Las organizaciones externas si interactuan con SyncFreight, pero lo hacen a traves de integraciones API con sus propios sistemas.' },
            { id: 'c', text: 'Utiliza su propio sistema (como Xcelerator o CXT) y se integra via API' },
            { id: 'd', text: 'Solo puede realizar operaciones de warehouse', explanation: 'Las organizaciones externas no estan limitadas a warehouse. Pueden ser shippers, vendors o service providers que se integran via API.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c1l2q4',
          question: 'Que funcion cumple un Shipper dentro del ecosistema de SyncFreight?',
          options: [
            { id: 'a', text: 'Es un conductor que entrega paquetes', explanation: 'Los conductores son Drivers o Flex Riders. Un Shipper es la organizacion que genera y envia la carga, no quien la transporta.' },
            { id: 'b', text: 'Es una organizacion que genera la carga a transportar' },
            { id: 'c', text: 'Es un administrador del sistema', explanation: 'Un Shipper no es un rol de usuario administrativo. Es una organizacion externa o interna que necesita que sus paquetes sean transportados.' },
            { id: 'd', text: 'Es el destinatario final de los paquetes', explanation: 'El destinatario es quien recibe el paquete. El Shipper es quien lo envia, es decir, quien genera la carga que debe ser transportada.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c1l2q6',
          question: 'Que es un Vendor en SyncFreight?',
          options: [
            { id: 'a', text: 'Un cliente que compra productos', explanation: 'Un Vendor no es un comprador. Es un proveedor que ofrece servicios logisticos como transporte de larga distancia o almacenamiento adicional.' },
            { id: 'b', text: 'Un proveedor de servicios logisticos externo' },
            { id: 'c', text: 'Un tipo de paquete especial', explanation: 'Vendor se refiere a un actor del ecosistema (proveedor de servicios logisticos), no a un tipo de envio o paquete.' },
            { id: 'd', text: 'Un modulo del frontend web', explanation: 'Vendor no es un componente de software. Es un rol de organizacion que provee servicios logisticos complementarios.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c1l2q7',
          question: 'Que actividades realizan los warehouses en SyncFreight?',
          options: [
            { id: 'a', text: 'Fabricacion de productos y control de calidad', explanation: 'Los warehouses de SyncFreight son centros de distribucion logistica, no plantas de fabricacion. Su funcion es procesar y despachar envios.' },
            { id: 'b', text: 'Recepcion, escaneo, clasificacion y despacho de envios' },
            { id: 'c', text: 'Venta directa al consumidor final', explanation: 'Los warehouses no realizan ventas. Son centros operativos donde se reciben, escanean, clasifican y despachan los envios.' },
            { id: 'd', text: 'Gestion de recursos humanos de la organizacion', explanation: 'La gestion de RRHH no es una funcion del warehouse. Sus actividades son logisticas: recepcion, escaneo, clasificacion y despacho.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c1l2q8',
          question: 'Como funcionan los Flex Riders en terminos de asignacion de rutas?',
          options: [
            { id: 'a', text: 'Tienen rutas fijas asignadas diariamente por un supervisor', explanation: 'Las rutas fijas asignadas por supervisores corresponden a los Drivers empleados. Los Flex Riders eligen libremente que rutas aceptar.' },
            { id: 'b', text: 'Se les ofrece un precio sugerido por ruta y pueden aceptar o rechazar' },
            { id: 'c', text: 'Solo pueden realizar entregas dentro de un radio de 5 kilometros', explanation: 'No existe una restriccion de radio de 5 km para Flex Riders. Su modelo se basa en aceptar o rechazar rutas con precio sugerido.' },
            { id: 'd', text: 'Deben completar un minimo de 20 entregas por dia', explanation: 'Los Flex Riders no tienen minimos obligatorios de entregas. Operan bajo demanda con total flexibilidad para aceptar o rechazar rutas.' }
          ],
          correctOptionId: 'b'
        }
      ]
    }
  },
  {
    title: 'Plataforma Tecnologica',
    order: 3,
    content: `
      <h2>Arquitectura Tecnologica de SyncFreight</h2>
      <p>
        SyncFreight esta construido sobre una arquitectura moderna que combina multiples tecnologias
        para ofrecer una plataforma robusta, escalable y en tiempo real. En esta leccion exploraremos
        cada componente tecnologico en detalle.
      </p>

      <h3>Backend: NestJS Monolith</h3>
      <p>
        El nucleo de SyncFreight es un <strong>monolito construido con NestJS</strong>, un framework
        de Node.js que facilita la construccion de aplicaciones server-side eficientes y escalables.
        El backend centraliza toda la logica de negocio y expone los servicios necesarios para los
        demas componentes.
      </p>
      <p>Responsabilidades principales del backend:</p>
      <ul>
        <li>Logica de negocio completa (envios, rutas, organizaciones, etc.)</li>
        <li>APIs REST para comunicacion con el frontend y apps moviles</li>
        <li>WebSockets para comunicacion en tiempo real (tracking, notificaciones)</li>
        <li>Gestion de autenticacion y autorizacion (JWT con RS256)</li>
        <li>Integraciones con servicios de Google Cloud Platform</li>
      </ul>

      <h3>Bases de Datos</h3>
      <p>SyncFreight utiliza dos bases de datos principales, cada una optimizada para un proposito diferente:</p>

      <table>
        <thead>
          <tr>
            <th>Base de Datos</th>
            <th>Tipo</th>
            <th>Proposito</th>
            <th>Modelo de Datos</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>MongoDB</strong></td>
            <td>Base de datos documental (NoSQL)</td>
            <td>Almacenamiento de datos operativos: envios, rutas, usuarios, configuracion</td>
            <td>Una base de datos por organizacion (multi-tenencia)</td>
          </tr>
          <tr>
            <td><strong>Neo4j</strong></td>
            <td>Base de datos de grafos</td>
            <td>Red logistica: nodos (warehouses, ciudades) y conexiones entre ellos (rutas, relaciones)</td>
            <td>Un unico grafo global compartido por todas las organizaciones</td>
          </tr>
        </tbody>
      </table>

      <div class="callout">
        <strong>Concepto clave:</strong> MongoDB sigue un modelo de <strong>una base de datos por organizacion</strong>
        (aislamiento completo de datos), mientras que Neo4j utiliza un <strong>unico grafo global</strong>
        que representa toda la red logistica. Esta distincion es fundamental para entender como
        se manejan los datos en SyncFreight.
      </div>

      <h3>Servicios de Google Cloud Platform</h3>
      <p>SyncFreight se apoya en varios servicios de Google Cloud Platform (GCP) para funcionalidades especificas:</p>
      <ul>
        <li>
          <strong>Cloud Tasks:</strong> Gestion de tareas asincronas y colas de trabajo. Permite
          ejecutar operaciones en segundo plano sin bloquear las solicitudes del usuario.
        </li>
        <li>
          <strong>Cloud Scheduler:</strong> Programacion de tareas recurrentes (cron jobs). Automatiza
          procesos periodicos como generacion de reportes o limpieza de datos.
        </li>
        <li>
          <strong>Secret Manager:</strong> Almacenamiento seguro de credenciales, claves API y otros
          secretos. Evita exponer informacion sensible en el codigo fuente.
        </li>
        <li>
          <strong>Cloud Storage:</strong> Almacenamiento de archivos como imagenes de pruebas de
          entrega (POD), documentos adjuntos y otros archivos asociados a envios.
        </li>
      </ul>

      <h3>Frontend Web: Angular 16</h3>
      <p>
        El frontend web de SyncFreight se conoce como <strong>sync-frontend</strong> y esta construido
        con <strong>Angular 16</strong>. Es el panel de administracion principal utilizado por:
      </p>
      <ul>
        <li><strong>Operadores:</strong> Gestion diaria de envios, rutas y asignaciones</li>
        <li><strong>Personal de warehouse:</strong> Procesamiento de paquetes entrantes y salientes</li>
        <li><strong>Administradores:</strong> Configuracion del sistema, gestion de usuarios y reportes</li>
      </ul>

      <h3>Aplicaciones Moviles</h3>
      <p>SyncFreight cuenta con dos aplicaciones moviles especializadas:</p>
      <table>
        <thead>
          <tr>
            <th>App</th>
            <th>Uso Principal</th>
            <th>Funcionalidades</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>SyncPod</strong></td>
            <td>Operaciones de drivers (last-mile)</td>
            <td>Tracking GPS en tiempo real, captura de pruebas de entrega (POD), escaneo de codigos de barras</td>
          </tr>
          <tr>
            <td><strong>Picoville</strong></td>
            <td>Operaciones middle-mile</td>
            <td>Principalmente paletizado</td>
          </tr>
        </tbody>
      </table>

      <h3>API y Comunicacion</h3>
      <p>La comunicacion entre los componentes de SyncFreight se realiza a traves de:</p>
      <ul>
        <li>
          <strong>REST API v6:</strong> La version actual de la API. Todos los endpoints siguen el
          estandar REST y estan versionados para garantizar compatibilidad.
        </li>
      </ul>

      <h3>Autenticacion</h3>
      <p>
        SyncFreight utiliza <strong>JWT (JSON Web Tokens)</strong> con el algoritmo <strong>RS256</strong>
        para autenticacion. RS256 es un algoritmo de firma asimetrica que utiliza un par de claves
        publica/privada, lo que proporciona mayor seguridad que los algoritmos simetricos.
      </p>

      <div class="callout warning">
        <strong>Importante:</strong> El backend es un monolito, no una arquitectura de microservicios.
        Toda la logica de negocio reside en una unica aplicacion NestJS. Esto simplifica el
        despliegue y la gestion, aunque requiere una buena organizacion interna del codigo.
      </div>
    `,
    test: {
      questions: [
        {
          id: 'c1l3q2',
          question: 'Cual es el proposito principal de Neo4j en la plataforma?',
          options: [
            { id: 'a', text: 'Almacenar datos de usuarios y credenciales', explanation: 'Los datos de usuarios y credenciales se almacenan en MongoDB. Neo4j se usa exclusivamente para representar la red logistica como grafo.' },
            { id: 'b', text: 'Servir como cache para acelerar consultas', explanation: 'La funcion de cache la cumple Redis, no Neo4j. Neo4j es una base de datos de grafos para modelar la red logistica.' },
            { id: 'c', text: 'Representar la red logistica como un grafo de nodos y conexiones' },
            { id: 'd', text: 'Almacenar archivos y documentos adjuntos', explanation: 'El almacenamiento de archivos se realiza en Google Cloud Storage. Neo4j modela la red logistica con nodos y conexiones.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c1l3q3',
          question: 'Que algoritmo de autenticacion utiliza SyncFreight para los JWT?',
          options: [
            { id: 'a', text: 'HS256 (simetrico)', explanation: 'HS256 es un algoritmo simetrico que usa una sola clave compartida. SyncFreight utiliza RS256, que es asimetrico y usa par de claves publica/privada.' },
            { id: 'b', text: 'RS256 (asimetrico)' },
            { id: 'c', text: 'MD5 (hash)', explanation: 'MD5 es una funcion de hash, no un algoritmo de firma para JWT. Ademas, MD5 se considera inseguro para aplicaciones criptograficas modernas.' },
            { id: 'd', text: 'SHA-512 (hash)', explanation: 'SHA-512 es una funcion de hash, no un algoritmo de firma JWT. SyncFreight usa RS256, que es un algoritmo de firma asimetrica.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c1l3q5',
          question: 'Cual es la diferencia entre SyncPod y Picoville?',
          options: [
            { id: 'a', text: 'SyncPod es para operaciones de drivers (last-mile) y Picoville para operaciones middle-mile' },
            { id: 'b', text: 'SyncPod es para Android y Picoville para iOS', explanation: 'La diferencia no es el sistema operativo. SyncPod se usa para operaciones last-mile de drivers y Picoville para operaciones middle-mile.' },
            { id: 'c', text: 'SyncPod es gratuito y Picoville es de pago', explanation: 'La distincion no es de precio sino de funcion: SyncPod es para entregas last-mile y Picoville para transporte middle-mile entre warehouses.' },
            { id: 'd', text: 'No hay diferencia, son la misma aplicacion con diferente nombre', explanation: 'Son aplicaciones distintas con propositos diferentes: SyncPod para last-mile (tracking, POD, escaneo) y Picoville para middle-mile (transporte entre warehouses).' }
          ],
          correctOptionId: 'a'
        },
        {
          id: 'c1l3q6',
          question: 'Que servicio de GCP se utiliza para almacenar credenciales y claves API de forma segura?',
          options: [
            { id: 'a', text: 'Cloud Storage', explanation: 'Cloud Storage se usa para almacenar archivos como imagenes de POD y documentos adjuntos, no para credenciales o secretos.' },
            { id: 'b', text: 'Cloud Tasks', explanation: 'Cloud Tasks gestiona tareas asincronas y colas de trabajo. El almacenamiento seguro de credenciales se hace con Secret Manager.' },
            { id: 'c', text: 'Secret Manager' },
            { id: 'd', text: 'Cloud Scheduler', explanation: 'Cloud Scheduler programa tareas recurrentes (cron jobs). Para almacenar credenciales de forma segura se usa Secret Manager.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c1l3q7',
          question: 'Que tipo de arquitectura tiene el backend de SyncFreight?',
          options: [
            { id: 'a', text: 'Microservicios distribuidos', explanation: 'SyncFreight no usa microservicios. Toda la logica de negocio reside en un unico monolito NestJS para simplificar el despliegue y la gestion.' },
            { id: 'b', text: 'Serverless (funciones en la nube)', explanation: 'El backend no es serverless. Es un monolito NestJS que se ejecuta como una aplicacion completa, no como funciones individuales en la nube.' },
            { id: 'c', text: 'Monolito construido con NestJS' },
            { id: 'd', text: 'Arquitectura orientada a eventos', explanation: 'Aunque SyncFreight usa WebSockets para tiempo real, su arquitectura principal es un monolito NestJS, no una arquitectura orientada a eventos.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c1l3q8',
          question: 'Como se diferencia el modelo de datos de MongoDB y Neo4j en SyncFreight?',
          options: [
            { id: 'a', text: 'MongoDB tiene una BD por organizacion; Neo4j tiene un unico grafo global' },
            { id: 'b', text: 'Ambos tienen una base de datos por organizacion', explanation: 'Solo MongoDB tiene una BD por organizacion. Neo4j utiliza un unico grafo global compartido por todas las organizaciones.' },
            { id: 'c', text: 'MongoDB es global y Neo4j es por organizacion', explanation: 'Es al reves: MongoDB tiene una BD por organizacion (aislamiento completo) y Neo4j tiene un unico grafo global compartido.' },
            { id: 'd', text: 'Ambos comparten una unica base de datos global', explanation: 'Solo Neo4j es global. MongoDB tiene bases de datos separadas por organizacion para garantizar el aislamiento de datos.' }
          ],
          correctOptionId: 'a'
        }
      ]
    }
  },
  {
    title: 'Multi-Tenencia y Organizaciones',
    order: 4,
    content: `
      <h2>Multi-Tenencia y Configuracion de Organizaciones</h2>
      <p>
        Uno de los pilares fundamentales de SyncFreight es su modelo de <strong>multi-tenencia</strong>.
        Este modelo permite que multiples organizaciones logisticas operen de forma completamente
        independiente dentro de la misma plataforma, cada una con su propia configuracion,
        datos y reglas de negocio.
      </p>

      <h3>Aislamiento de Datos</h3>
      <p>
        Cada organizacion en SyncFreight tiene su <strong>propia base de datos MongoDB</strong>.
        Esto garantiza un aislamiento completo de datos entre organizaciones:
      </p>
      <ul>
        <li>Los envios de una organizacion no son visibles para otra</li>
        <li>Los usuarios pertenecen a una organizacion especifica</li>
        <li>Las configuraciones son completamente independientes</li>
        <li>Un fallo o problema en una organizacion no afecta a las demas</li>
      </ul>

      <div class="callout">
        <strong>Concepto clave:</strong> El aislamiento por base de datos es el nivel mas alto
        de separacion de datos en multi-tenencia. A diferencia de modelos que usan una sola base
        de datos con un campo <code>organizationId</code>, SyncFreight utiliza bases de datos
        fisicamente separadas para cada organizacion.
      </div>

      <h3>Configuracion Independiente por Organizacion</h3>
      <p>
        Cada organizacion puede personalizar su experiencia en SyncFreight a traves de
        multiples parametros de configuracion:
      </p>

      <table>
        <thead>
          <tr>
            <th>Parametro</th>
            <th>Descripcion</th>
            <th>Ejemplo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Sistema de medidas</strong></td>
            <td>Define si se utilizan unidades metricas o imperiales</td>
            <td>Metrico (kg, km) vs Imperial (lb, mi)</td>
          </tr>
          <tr>
            <td><strong>Zona horaria</strong></td>
            <td>Timezone de operacion de la organizacion</td>
            <td>America/New_York, Europe/Madrid, America/Bogota</td>
          </tr>
          <tr>
            <td><strong>Preferencias de notificacion</strong></td>
            <td>Configuracion de alertas y comunicaciones automaticas</td>
            <td>Notificaciones por email, SMS, push a la app</td>
          </tr>
          <tr>
            <td><strong>Integraciones externas</strong></td>
            <td>Conexiones con sistemas de terceros</td>
            <td>APIs de shippers, sistemas ERP, plataformas de e-commerce</td>
          </tr>
          <tr>
            <td><strong>Rate plans y tarifas</strong></td>
            <td>Estructura de precios y costos de servicio</td>
            <td>Tarifas por zona, peso, tipo de servicio, urgencia</td>
          </tr>
          <tr>
            <td><strong>Flujos de envio</strong></td>
            <td>Definicion de los pasos y estados por los que pasa un envio</td>
            <td>Flujo personalizado de estados: creado, en warehouse, en ruta, entregado</td>
          </tr>
        </tbody>
      </table>

      <h3>Red Logistica en Neo4j</h3>
      <p>
        Ademas de su base de datos MongoDB, cada organizacion tiene su propia
        <strong>topologia de red logistica</strong> representada en Neo4j. Esta red define:
      </p>
      <ul>
        <li><strong>Nodos:</strong> Warehouses, ciudades, puntos de distribucion</li>
        <li><strong>Conexiones:</strong> Rutas de transporte entre nodos, relaciones entre organizaciones</li>
      </ul>
      <p>
        Aunque Neo4j utiliza un unico grafo global, cada organizacion gestiona su propia
        porcion del grafo con sus nodos y conexiones especificos.
      </p>

      <h3>Niveles de Suscripcion (Tiers)</h3>
      <p>
        Las organizaciones en SyncFreight tienen <strong>niveles de suscripcion</strong> (tiers)
        que determinan las funcionalidades disponibles. Esto permite ofrecer diferentes paquetes
        de servicio segun las necesidades y presupuesto de cada cliente.
      </p>
      <ul>
        <li>Ciertos endpoints de la API estan restringidos por nivel de suscripcion</li>
        <li>Funcionalidades avanzadas como facturacion especializada requieren niveles superiores (ej: <code>TIER_ONE</code>)</li>
        <li>Los permisos del sistema respetan los limites del tier contratado</li>
      </ul>

      <div class="callout warning">
        <strong>Importante:</strong> El nivel de suscripcion no solo limita funcionalidades visibles
        en la interfaz, sino que tambien restringe el acceso a nivel de API. Si una organizacion
        intenta acceder a un endpoint que requiere un tier superior, recibira un error de autorizacion.
      </div>

      <h3>Organizaciones Externas: Shippers, Vendors y Service Providers</h3>
      <p>
        Ademas de las organizaciones principales que operan directamente en SyncFreight,
        existen organizaciones externas que interactuan con el ecosistema:
      </p>

      <table>
        <thead>
          <tr>
            <th>Rol</th>
            <th>Naturaleza Interna</th>
            <th>Naturaleza Externa</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Shipper</strong></td>
            <td>Tiene cuenta propia en SYNC, gestiona sus envios directamente desde la plataforma</td>
            <td>Usa su propio sistema y se conecta via integracion API</td>
          </tr>
          <tr>
            <td><strong>Vendor</strong></td>
            <td>Opera dentro de SYNC como proveedor de servicios logisticos</td>
            <td>Ofrece sus servicios a traves de su propio sistema (Xcelerator, CXT, etc.) y se integra directamente</td>
          </tr>
          <tr>
            <td><strong>Service Provider</strong></td>
            <td>No se permite.</td>
            <td>Provee servicios especializados, solo existe para llevar el control financiero pero no tiene conexión con otro sistema</td>
          </tr>
        </tbody>
      </table>

      <div class="callout">
        <strong>Resumen:</strong> La multi-tenencia en SyncFreight combina aislamiento total de datos
        (una BD por organizacion), configuracion independiente, topologia de red propia y niveles de
        suscripcion. Todo esto permite que cada organizacion opere como si tuviera su propia instancia
        del sistema, mientras comparte la infraestructura comun de la plataforma.
      </div>
    `,
    test: {
      questions: [
        {
          id: 'c1l4q2',
          question: 'Que parametros de configuracion puede personalizar cada organizacion?',
          options: [
            { id: 'a', text: 'Unicamente el nombre y logo de la organizacion', explanation: 'La personalizacion va mucho mas alla del nombre y logo. Incluye sistema de medidas, timezone, notificaciones, integraciones, rate plans y flujos de envio.' },
            { id: 'b', text: 'Sistema de medidas, timezone, notificaciones, integraciones y rate plans' },
            { id: 'c', text: 'Solo la zona horaria y el idioma del sistema', explanation: 'La configuracion no se limita a timezone e idioma. Tambien abarca sistema de medidas, notificaciones, integraciones externas, rate plans y flujos de envio.' },
            { id: 'd', text: 'La configuracion es identica para todas las organizaciones', explanation: 'Cada organizacion tiene configuracion completamente independiente. Pueden personalizar multiples parametros como medidas, timezone, notificaciones y tarifas.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c1l4q3',
          question: 'Que determina el nivel de suscripcion (tier) de una organizacion?',
          options: [
            { id: 'a', text: 'El numero maximo de nodo que puede tener', explanation: 'El tier no limita la cantidad de nodos.' },
            { id: 'b', text: 'Las funcionalidades y endpoints de la API disponibles para la organizacion' },
            { id: 'c', text: 'La velocidad de conexion a Internet de la organizacion', explanation: 'La velocidad de conexion es independiente del tier. El nivel de suscripcion controla el acceso a funcionalidades y endpoints especificos de la API.' },
            { id: 'd', text: 'El numero de warehouses que puede registrar', explanation: 'El tier no limita la cantidad de warehouses. Define que funcionalidades avanzadas y endpoints de la API puede utilizar la organizacion.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c1l4q4',
          question: 'Que sucede cuando una organizacion intenta acceder a un endpoint que requiere un tier superior?',
          options: [
            { id: 'a', text: 'El sistema le permite acceder pero con funcionalidad limitada', explanation: 'El sistema no ofrece acceso parcial. Si el tier no es suficiente, el acceso se deniega completamente con un error de autorizacion.' },
            { id: 'b', text: 'El endpoint funciona normalmente sin restricciones', explanation: 'Los endpoints restringidos por tier no son accesibles sin el nivel adecuado. La organizacion recibe un error de autorizacion.' },
            { id: 'c', text: 'Recibe un error de autorizacion' },
            { id: 'd', text: 'Se le cobra automaticamente el costo del tier superior', explanation: 'El sistema no cobra automaticamente por acceder a funcionalidades superiores. Simplemente bloquea el acceso con un error de autorizacion.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c1l4q7',
          question: 'Que ventaja ofrece el aislamiento por base de datos frente a un modelo de BD compartida?',
          options: [
            { id: 'a', text: 'Es mas economico en terminos de almacenamiento', explanation: 'El aislamiento por BD separadas es generalmente mas costoso en almacenamiento que una BD compartida. Su ventaja es la seguridad y el aislamiento de datos.' },
            { id: 'b', text: 'Permite consultas mas rapidas entre organizaciones', explanation: 'Al tener bases de datos separadas, las consultas entre organizaciones son mas dificiles, no mas faciles. La ventaja es el aislamiento y la proteccion ante fallos.' },
            { id: 'c', text: 'Un fallo en una organizacion no afecta a las demas y los datos estan completamente separados' },
            { id: 'd', text: 'Facilita la migracion de datos entre organizaciones', explanation: 'Migrar datos entre bases de datos separadas es mas complejo que en una BD compartida. La ventaja real es el aislamiento total y la proteccion ante fallos.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c1l4q8',
          question: 'Que es un flujo de envio (shipment flow) en el contexto de la configuracion de una organizacion?',
          options: [
            { id: 'a', text: 'La velocidad con la que se procesan los envios', explanation: 'El flujo de envio no se refiere a velocidad de procesamiento. Es la definicion de los pasos y estados configurados por los que pasa un envio.' },
            { id: 'b', text: 'La definicion personalizada de los pasos y estados por los que pasa un envio' },
            { id: 'c', text: 'El camino fisico que recorre un paquete entre warehouses', explanation: 'La ruta fisica es una operacion logistica de transporte. El flujo de envio define los estados del sistema (creado, en warehouse, en ruta, entregado).' },
            { id: 'd', text: 'Un tipo de reporte que muestra el volumen de envios por dia', explanation: 'Un flujo de envio no es un reporte. Es la configuracion de los pasos y estados que un envio atraviesa dentro de esa organizacion.' }
          ],
          correctOptionId: 'b'
        }
      ]
    }
  }
];
