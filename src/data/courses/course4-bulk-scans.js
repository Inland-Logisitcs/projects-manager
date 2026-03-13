export const course4Data = {
  title: 'Operaciones de Warehouse - Bulk Scans',
  description: 'Domina las operaciones de warehouse: inbound, reinbound, dispatch last-mile y middle-mile, RTS, inventario y recepcion flex.',
  order: 4,
  published: true,
  totalLessons: 5
};

export const course4Lessons = [
  // LESSON 1
  {
    title: 'Fundamentos de Bulk Scans',
    order: 1,
    content: `
<h2>Que es un Bulk Scan?</h2>
<p>Un <strong>Bulk Scan</strong> representa un proceso de escaneo masivo de codigos de barras. Es la unidad fundamental de las operaciones de warehouse en SyncFreight. Aunque se asocia tipicamente a operaciones de almacen, puede representar cualquier tipo de operacion de escaneo masivo dentro del sistema.</p>

<h2>Tipos de Bulk Scan</h2>
<table>
<tr><th>Tipo</th><th>Nombre</th><th>Descripcion</th><th>Requisitos especiales</th></tr>
<tr><td><code>inbound</code></td><td>Recepcion</td><td>Recepcion de paquetes en el warehouse</td><td>Ninguno</td></tr>
<tr><td><code>reinbound</code></td><td>Re-ingreso</td><td>Re-entrada de paquetes devueltos</td><td>Requiere razon de devolucion</td></tr>
<tr><td><code>dispatchLM</code></td><td>Despacho Last-Mile</td><td>Despacho para entrega final al destinatario</td><td>Requiere conductor asignado</td></tr>
<tr><td><code>dispatchMM</code></td><td>Despacho Middle-Mile</td><td>Despacho entre warehouses</td><td>Requiere paletizacion</td></tr>
<tr><td><code>rts</code></td><td>Return to Sender</td><td>Devolucion al remitente</td><td>Solo primer warehouse de la ruta</td></tr>
<tr><td><code>inventory</code></td><td>Inventario</td><td>Conteo ciclico de envios</td><td>Genera lista completa al inicio</td></tr>
<tr><td><code>flexRouteReception</code></td><td>Recepcion Flex</td><td>Recepcion de paquetes de rutas flex</td><td>Solo paquetes de la ruta seleccionada</td></tr>
<tr><td><code>product_inventory</code></td><td>Inventario de Producto</td><td>Inventario a nivel de caja/stock</td><td>Escanea referencias internas, no tracking numbers</td></tr>
</table>

<h2>Flujo General de un Bulk Scan</h2>
<p>Todos los tipos de bulk scan siguen un patron general:</p>
<ul>
<li><strong>Paso 1 - Creacion:</strong> Se crea el bulk scan indicando su tipo. Dependiendo del tipo, se configuran parametros adicionales (nodo, vehiculos, ruta, etc.).</li>
<li><strong>Paso 2 - Generacion de historiales:</strong> Algunos tipos como <code>inventory</code> generan todos los registros (historiales) al momento de la creacion. Otros tipos como <code>inbound</code> crean los historiales a medida que se escanean los paquetes.</li>
<li><strong>Paso 3 - Escaneo:</strong> Se procesan los codigos de barras uno a uno o por lote (por ejemplo, escaneando un pallet completo).</li>
<li><strong>Paso 4 - Cierre:</strong> Se finaliza el bulk scan cuando se completa la operacion.</li>
</ul>

<div class="callout">
<strong>Concepto clave - History:</strong> Un "history" (historial) representa un codigo de barras que debe ser o fue escaneado dentro de un bulk scan. Cada history registra el resultado del escaneo, la fecha, el usuario que escaneo y cualquier metadata adicional asociada al tipo de operacion.
</div>

<h2>Estados del Bulk Scan</h2>
<p>Un bulk scan tiene dos estados posibles durante su ciclo de vida:</p>
<table>
<tr><th>Estado</th><th>Descripcion</th></tr>
<tr><td><code>pending</code></td><td>El escaneo esta en progreso. Se pueden seguir escaneando paquetes y el bulk scan acepta nuevas operaciones.</td></tr>
<tr><td><code>completed</code></td><td>El escaneo ha finalizado. No se aceptan mas escaneos y la operacion queda cerrada para consulta y reportes.</td></tr>
</table>

<h2>Actualizaciones en Tiempo Real</h2>
<p>Para mantener la interfaz actualizada durante el proceso de escaneo, el sistema utiliza <strong>polling</strong> (consultas periodicas al servidor). Esto permite que multiples operadores vean el progreso del escaneo en tiempo real, incluyendo:</p>
<ul>
<li>Cantidad de paquetes escaneados vs. esperados</li>
<li>Estadisticas agrupadas por resultado de escaneo</li>
<li>Alertas de paquetes problematicos o bloqueados</li>
<li>Progreso general de la operacion</li>
</ul>

<div class="callout warning">
<strong>Importante:</strong> A diferencia de otras funcionalidades del sistema que usan WebSockets, los bulk scans utilizan polling. Esto significa que puede existir un breve retraso entre el momento del escaneo y la actualizacion visual en pantallas de otros operadores.
</div>

<h2>Relacion entre Tipos y Flujo de Historiales</h2>
<p>Es fundamental entender la diferencia en como se generan los historiales segun el tipo de bulk scan:</p>
<table>
<tr><th>Generacion al inicio</th><th>Generacion durante escaneo</th></tr>
<tr><td><code>inventory</code> - Crea un historial por cada envio que deberia estar en el warehouse</td><td><code>inbound</code> - Crea un historial cada vez que se escanea un paquete nuevo</td></tr>
<tr><td><code>product_inventory</code> - Crea registros de todo el stock esperado</td><td><code>reinbound</code> - Registra cada devolucion al momento del escaneo</td></tr>
<tr><td><code>flexRouteReception</code> - Crea lista de envios de la ruta seleccionada</td><td><code>dispatchLM</code> - Registra cada paquete despachado</td></tr>
<tr><td></td><td><code>dispatchMM</code> - Registra asignaciones a pallets</td></tr>
<tr><td></td><td><code>rts</code> - Registra cada paquete para devolucion</td></tr>
</table>
`,
    test: {
      questions: [
        {
          id: 'c4l1q1',
          question: 'Que representa un Bulk Scan en el sistema SyncFreight?',
          options: [
            { id: 'a', text: 'Un proceso de escaneo masivo de codigos de barras para operaciones de warehouse u otras operaciones' },
            { id: 'b', text: 'Un escaneo individual de un unico paquete para verificar su estado', explanation: 'Un Bulk Scan no es un escaneo individual sino un proceso masivo que permite procesar multiples codigos de barras en una sola operacion.' },
            { id: 'c', text: 'Un reporte automatico generado por el sistema cada 24 horas', explanation: 'Un Bulk Scan no es un reporte automatico, es un proceso operativo de escaneo masivo que requiere intervencion del operador.' },
            { id: 'd', text: 'Una herramienta exclusiva para operaciones de inventario', explanation: 'Un Bulk Scan no es exclusivo de inventario; abarca multiples tipos de operaciones como inbound, reinbound, dispatch, RTS y mas.' }
          ],
          correctOptionId: 'a'
        },
        {
          id: 'c4l1q2',
          question: 'Cual de los siguientes tipos de bulk scan requiere paletizacion?',
          options: [
            { id: 'a', text: 'dispatchLM (despacho last-mile)', explanation: 'El despacho last-mile agrupa paquetes por conductor, no por pallet. No requiere paletizacion.' },
            { id: 'b', text: 'inbound (recepcion)', explanation: 'El inbound es un proceso de recepcion de paquetes individuales, no involucra agrupacion en pallets.' },
            { id: 'c', text: 'dispatchMM (despacho middle-mile)' },
            { id: 'd', text: 'rts (return to sender)', explanation: 'El RTS agrupa paquetes en pallets para devolucion, pero su requisito especial es operar solo desde el primer warehouse, no la paletizacion como tal.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c4l1q3',
          question: 'Que es un "history" (historial) en el contexto de un bulk scan?',
          options: [
            { id: 'a', text: 'Un log de errores del sistema durante la operacion', explanation: 'Un history no es un log de errores. Es un registro de cada codigo de barras procesado, incluyendo escaneos exitosos y fallidos.' },
            { id: 'b', text: 'Un registro que representa un codigo de barras que debe ser o fue escaneado' },
            { id: 'c', text: 'El historial de movimientos previos del bulk scan entre warehouses', explanation: 'Un history no registra movimientos del bulk scan sino de un codigo de barras individual dentro de la operacion de escaneo.' },
            { id: 'd', text: 'Una copia de seguridad automatica de la operacion', explanation: 'Un history no es una copia de seguridad. Es un registro operativo que documenta el resultado del escaneo de cada codigo de barras.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c4l1q4',
          question: 'Cuales son los dos estados posibles de un bulk scan?',
          options: [
            { id: 'a', text: 'active y inactive', explanation: 'Los estados del bulk scan no son active/inactive. El sistema usa pending para escaneo en progreso y completed para finalizado.' },
            { id: 'b', text: 'open y closed', explanation: 'Los estados del bulk scan no son open/closed. Los nombres correctos son pending y completed.' },
            { id: 'c', text: 'pending y completed' },
            { id: 'd', text: 'scanning y finished', explanation: 'Los estados del bulk scan no son scanning/finished. Se denominan pending (acepta escaneos) y completed (cerrado).' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c4l1q5',
          question: 'Como se mantiene actualizada la interfaz durante un proceso de bulk scan?',
          options: [
            { id: 'a', text: 'Mediante WebSockets con conexion permanente al servidor', explanation: 'Aunque otras funcionalidades del sistema usan WebSockets, los bulk scans especificamente utilizan polling en lugar de WebSockets.' },
            { id: 'b', text: 'Mediante polling (consultas periodicas al servidor)' },
            { id: 'c', text: 'Mediante notificaciones push del navegador', explanation: 'Los bulk scans no usan notificaciones push del navegador. Utilizan polling, que son consultas periodicas al servidor para obtener actualizaciones.' },
            { id: 'd', text: 'La interfaz no se actualiza hasta que se cierra el bulk scan', explanation: 'La interfaz si se actualiza durante el proceso de escaneo mediante polling, permitiendo ver el progreso en tiempo real.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c4l1q6',
          question: 'Que tipo de bulk scan requiere obligatoriamente una razon de devolucion?',
          options: [
            { id: 'a', text: 'inbound', explanation: 'El inbound es recepcion de paquetes nuevos al warehouse y no requiere razon de devolucion ya que los paquetes llegan por primera vez.' },
            { id: 'b', text: 'rts', explanation: 'El RTS (Return to Sender) gestiona la devolucion al remitente, pero su requisito especial es operar solo desde el primer warehouse de la ruta, no una razon de devolucion.' },
            { id: 'c', text: 'reinbound' },
            { id: 'd', text: 'inventory', explanation: 'El inventario es un conteo ciclico de envios presentes en el warehouse. No involucra devoluciones ni requiere razones de devolucion.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c4l1q7',
          question: 'En que se diferencia un bulk scan de tipo inventory de uno de tipo inbound respecto a la generacion de historiales?',
          options: [
            { id: 'a', text: 'Ambos generan historiales al momento de la creacion del bulk scan', explanation: 'Solo inventory genera todos los historiales al inicio. El inbound crea los historiales uno a uno a medida que se escanean los paquetes.' },
            { id: 'b', text: 'Inventory genera todos los historiales al inicio; inbound los crea a medida que se escanea' },
            { id: 'c', text: 'Inbound genera todos los historiales al inicio; inventory los crea a medida que se escanea', explanation: 'Esta invertido: es el inventory el que genera la lista completa al inicio, mientras que el inbound crea historiales conforme se escanean los paquetes.' },
            { id: 'd', text: 'Ninguno de los dos genera historiales, solo registran conteos', explanation: 'Ambos tipos si generan historiales. La diferencia esta en cuando los generan: inventory al inicio y inbound durante el escaneo.' }
          ],
          correctOptionId: 'b'
        },
      ]
    }
  },
  // LESSON 2
  {
    title: 'Inbound y Sort',
    order: 2,
    content: `
<h2>Que es el Inbound?</h2>
<p>El <strong>Inbound</strong> (tambien llamado "sort") es el proceso de recepcion de paquetes en el warehouse. Es la primera operacion que se realiza cuando los vehiculos llegan al centro de distribucion con carga. A traves de este proceso, cada paquete es escaneado, validado y registrado en el sistema como presente en el almacen.</p>

<h2>Flujo Completo del Inbound</h2>
<h3>Paso 1: Creacion del Inbound</h3>
<p>Para iniciar un inbound se debe indicar:</p>
<ul>
<li><strong>Nodo (warehouse):</strong> El almacen donde se esta realizando la recepcion.</li>
<li><strong>Vehiculos:</strong> Los vehiculos que estan descargando paquetes en esta operacion.</li>
</ul>
<p>Al crear el inbound, el sistema <strong>genera automaticamente actividades facturables</strong> (billable activities) asociadas a los costos de la operacion de recepcion. Esto permite llevar un control financiero preciso de cada operacion de warehouse.</p>

<h3>Paso 2: Escaneo de Paquetes</h3>
<p>Para cada paquete escaneado, el sistema ejecuta una serie de validaciones en orden:</p>
<ul>
<li>Verificar que el paquete no haya sido escaneado previamente en este inbound</li>
<li>Verificar que el envio (shipment) exista en el sistema</li>
<li>Verificar que el envio corresponda a este warehouse</li>
<li>Verificar que el envio este en un estado valido para recepcion</li>
<li>Verificar que el envio no tenga bloqueos activos</li>
</ul>

<h3>Paso 3: Visualizacion de Estadisticas</h3>
<p>Durante y despues del inbound, el sistema muestra estadisticas agrupadas por:</p>
<ul>
<li><strong>Resultado del escaneo:</strong> Exitosos, missorts, duplicados, bloqueados, etc.</li>
<li><strong>Estado destino:</strong> A que estado pasaron los envios procesados.</li>
<li><strong>Vehiculo:</strong> Cuantos paquetes se procesaron por cada vehiculo.</li>
<li><strong>Ruta:</strong> Distribucion de paquetes por ruta asignada.</li>
</ul>

<h2>Resultados del Escaneo</h2>
<table>
<tr><th>Resultado</th><th>Condicion</th><th>Accion del sistema</th></tr>
<tr><td><strong>Exitoso (Successful)</strong></td><td>El envio existe, corresponde al warehouse, no esta bloqueado</td><td>Cambia estado a <code>warehouse</code></td></tr>
<tr><td><strong>Missort</strong></td><td>El tracking number no existe en el sistema</td><td>Se registra como anomalia. Si el shipper tiene plataforma externa y el codigo es valido (11 digitos, empieza con "67"), se intenta auto-creacion del envio</td></tr>
<tr><td><strong>Posible duplicado</strong></td><td>El envio existe pero esta en otro nodo o en un estado inesperado</td><td>Se registra con un comentario explicativo detallando la situacion</td></tr>
<tr><td><strong>Bloqueado (Blocked)</strong></td><td>El envio tiene un bloqueo activo</td><td>Se registra en el warehouse pero se adjunta un comentario del issue de bloqueo</td></tr>
<tr><td><strong>Duplicado (Duplicate)</strong></td><td>Ya fue escaneado en este mismo inbound</td><td>Sin cambio, se ignora el escaneo</td></tr>
</table>

<div class="callout">
<strong>Auto-creacion de envios:</strong> Cuando se detecta un missort y el shipper tiene configurada una plataforma externa, el sistema intenta crear el envio automaticamente si el codigo de barras cumple con el formato valido: 11 digitos y comienza con "67". Esto permite recibir paquetes que aun no fueron cargados al sistema por el shipper.
</div>

<h2>Acciones Correctivas</h2>
<p>Cuando un escaneo produce un resultado no exitoso, el operador puede tomar diferentes acciones correctivas:</p>
<table>
<tr><th>Accion</th><th>Descripcion</th><th>Caso de uso</th></tr>
<tr><td><strong>RTS</strong></td><td>Marcar para devolucion al remitente</td><td>Paquete que no corresponde y debe devolverse</td></tr>
<tr><td><strong>Registrar y reimprimir</strong></td><td>Registrar el paquete y reimprimir etiqueta</td><td>Etiqueta danada o ilegible</td></tr>
<tr><td><strong>Dejar en warehouse</strong></td><td>Mantener el paquete en almacen sin accion inmediata</td><td>Paquete que necesita investigacion adicional</td></tr>
<tr><td><strong>Reimprimir etiqueta</strong></td><td>Generar nueva etiqueta para el paquete</td><td>Etiqueta danada pero paquete ya registrado</td></tr>
<tr><td><strong>Error de escaneo</strong></td><td>Descartar el escaneo como error del operador</td><td>Lectura accidental o incorrecta del codigo</td></tr>
</table>

<h2>Escaneo de Pallets</h2>
<p>El inbound soporta el escaneo de codigos de pallet ademas de codigos individuales de paquetes. Cuando se escanea un <strong>codigo de pallet</strong>, el sistema procesa automaticamente todos los paquetes contenidos en ese pallet de una sola vez.</p>

<div class="callout warning">
<strong>Origen del pallet:</strong> Los pallets que se escanean en el inbound provienen de operaciones de despacho middle-mile. Cuando un warehouse envia paquetes agrupados en un pallet a otro warehouse, el warehouse receptor puede escanear el codigo del pallet completo en lugar de escanear cada paquete individualmente, agilizando significativamente la operacion.
</div>

<h2>Cambio de Estado</h2>
<p>El cambio de estado principal durante un inbound exitoso es:</p>
<pre>order_received -> warehouse</pre>
<p>Esto significa que el paquete paso de estar "recibido como orden" a estar fisicamente "en el warehouse" y disponible para la siguiente operacion logistica (despacho, clasificacion, etc.).</p>

<h3>Flujo de estados completo en inbound</h3>
<ul>
<li>Si el paquete esta en <code>order_received</code>: cambia a <code>warehouse</code></li>
<li>Si el paquete viene de middle-mile (estado <code>dispatched</code>): cambia a <code>warehouse</code> en el nodo destino</li>
<li>Si el paquete esta bloqueado: se registra en <code>warehouse</code> pero con issue adjunto</li>
</ul>
`,
    test: {
      questions: [
        {
          id: 'c4l2q1',
          question: 'Que se genera automaticamente al crear un inbound?',
          options: [
            { id: 'a', text: 'Rutas de entrega para los conductores', explanation: 'Las rutas de entrega se generan en el proceso de dispatch, no durante el inbound. El inbound es recepcion, no despacho.' },
            { id: 'b', text: 'Actividades facturables (billable activities) asociadas a los costos de la operacion' },
            { id: 'c', text: 'Etiquetas nuevas para todos los paquetes', explanation: 'Las etiquetas no se generan automaticamente al crear un inbound. La reimpresion de etiquetas es una accion correctiva manual disponible durante el escaneo.' },
            { id: 'd', text: 'Notificaciones push a los shippers', explanation: 'El sistema no envia notificaciones push a los shippers al crear un inbound. Lo que se genera son actividades facturables para control financiero.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c4l2q2',
          question: 'Que sucede cuando se escanea un tracking number que no existe en el sistema durante un inbound?',
          options: [
            { id: 'a', text: 'Se bloquea el inbound completo hasta resolver el problema', explanation: 'El inbound no se bloquea por un tracking inexistente. Se registra como missort y el proceso continua con los demas paquetes.' },
            { id: 'b', text: 'Se registra como Missort. Si el shipper tiene plataforma externa y el codigo es valido (11 digitos, empieza con "67"), se intenta auto-creacion' },
            { id: 'c', text: 'Se descarta automaticamente sin registro', explanation: 'El escaneo no se descarta sin registro. Se registra como missort para mantener trazabilidad de la anomalia.' },
            { id: 'd', text: 'Se crea un envio nuevo automaticamente sin condiciones', explanation: 'La auto-creacion de envios tiene condiciones: el shipper debe tener plataforma externa y el codigo debe cumplir el formato valido (11 digitos, empieza con "67").' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c4l2q3',
          question: 'Cual es el cambio de estado principal cuando un paquete se escanea exitosamente en un inbound?',
          options: [
            { id: 'a', text: 'pending -> warehouse', explanation: 'El estado pending no es un estado de envio en el flujo de inbound. El estado previo correcto es order_received.' },
            { id: 'b', text: 'warehouse -> dispatched', explanation: 'Este cambio de estado corresponde al proceso de dispatch (despacho), no al inbound. El inbound lleva paquetes al estado warehouse, no desde el.' },
            { id: 'c', text: 'order_received -> warehouse' },
            { id: 'd', text: 'order_received -> dispatched', explanation: 'El inbound no cambia el estado a dispatched. El paquete pasa a warehouse al ser recibido; dispatched ocurre en el proceso de despacho posterior.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c4l2q4',
          question: 'Que ocurre cuando se escanea un paquete que tiene un bloqueo activo?',
          options: [
            { id: 'a', text: 'Se rechaza el escaneo completamente y no se registra', explanation: 'El escaneo no se rechaza. El paquete bloqueado si se registra en el warehouse, pero con un comentario del issue de bloqueo adjunto.' },
            { id: 'b', text: 'Se registra en el warehouse pero se adjunta un comentario del issue de bloqueo' },
            { id: 'c', text: 'Se elimina el bloqueo automaticamente y se procesa como exitoso', explanation: 'El sistema no elimina el bloqueo automaticamente. El paquete se registra manteniendo el bloqueo activo y adjuntando un comentario del issue.' },
            { id: 'd', text: 'Se marca como missort y requiere accion manual', explanation: 'Un paquete bloqueado no se marca como missort. Missort es cuando el tracking number no existe. El paquete bloqueado si se registra pero con su issue adjunto.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c4l2q5',
          question: 'Para que sirve el escaneo de codigo de pallet durante un inbound?',
          options: [
            { id: 'a', text: 'Para registrar el pallet como unidad de inventario independiente', explanation: 'El objetivo no es registrar el pallet como inventario. Es procesar todos los paquetes del pallet de una sola vez para agilizar la recepcion.' },
            { id: 'b', text: 'Para procesar automaticamente todos los paquetes contenidos en ese pallet de una sola vez' },
            { id: 'c', text: 'Para generar la etiqueta del pallet en el warehouse receptor', explanation: 'Escanear un pallet en inbound no genera etiquetas. Su proposito es procesar masivamente todos los paquetes contenidos en el pallet.' },
            { id: 'd', text: 'Para iniciar un proceso de despacho middle-mile', explanation: 'Los pallets en inbound provienen de un despacho middle-mile previo. Escanearlos en inbound es para recepcion, no para iniciar un nuevo despacho.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c4l2q6',
          question: 'Cual de las siguientes NO es una accion correctiva disponible durante un inbound?',
          options: [
            { id: 'a', text: 'RTS (devolucion al remitente)', explanation: 'RTS si es una accion correctiva valida durante el inbound, utilizada cuando un paquete no corresponde y debe devolverse al remitente.' },
            { id: 'b', text: 'Registrar y reimprimir etiqueta', explanation: 'Registrar y reimprimir si es una accion correctiva valida, usada cuando la etiqueta esta danada o ilegible.' },
            { id: 'c', text: 'Transferir a otro warehouse automaticamente' },
            { id: 'd', text: 'Error de escaneo', explanation: 'Error de escaneo si es una accion correctiva valida, usada para descartar lecturas accidentales o incorrectas del codigo.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c4l2q7',
          question: 'Que resultado se obtiene cuando un envio ya fue escaneado previamente en el mismo inbound?',
          options: [
            { id: 'a', text: 'Posible duplicado con comentario explicativo', explanation: 'Posible duplicado se da cuando el envio existe pero esta en otro nodo o estado inesperado. Si ya fue escaneado en el mismo inbound, es simplemente Duplicado.' },
            { id: 'b', text: 'Missort', explanation: 'Missort ocurre cuando el tracking number no existe en el sistema, no cuando un paquete ya fue escaneado previamente en el mismo inbound.' },
            { id: 'c', text: 'Duplicado - sin cambio, se ignora el escaneo' },
            { id: 'd', text: 'Bloqueado', explanation: 'Bloqueado se refiere a paquetes con un bloqueo activo en el sistema, no a paquetes ya escaneados en el mismo inbound.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c4l2q8',
          question: 'Por cuales criterios se pueden agrupar las estadisticas del inbound?',
          options: [
            { id: 'a', text: 'Solo por resultado del escaneo', explanation: 'El resultado del escaneo es solo uno de los cuatro criterios disponibles. Tambien se puede agrupar por estado destino, vehiculo y ruta.' },
            { id: 'b', text: 'Por resultado del escaneo, estado destino, vehiculo y ruta' },
            { id: 'c', text: 'Por fecha, operador y turno', explanation: 'Fecha, operador y turno no son los criterios de agrupacion de estadisticas del inbound. Los criterios son resultado del escaneo, estado destino, vehiculo y ruta.' },
            { id: 'd', text: 'Solo por vehiculo y conductor', explanation: 'Vehiculo es uno de los criterios, pero conductor no lo es. Los cuatro criterios son resultado del escaneo, estado destino, vehiculo y ruta.' }
          ],
          correctOptionId: 'b'
        }
      ]
    }
  },
  // LESSON 3
  {
    title: 'Reinbound y RTS',
    order: 3,
    content: `
<h2>Reinbound: Re-ingreso de Paquetes</h2>
<p>El <strong>Reinbound</strong> es el proceso de re-entrada de paquetes que regresan al warehouse despues de un intento de entrega fallido u otra situacion que requiera su retorno. A diferencia del inbound regular, el reinbound <strong>siempre requiere una razon de devolucion</strong> para cada paquete escaneado.</p>

<h3>Validaciones del Reinbound</h3>
<p>Al escanear un paquete en un reinbound, el sistema realiza las siguientes validaciones:</p>
<ul>
<li>Verificar que el paquete <strong>no este en proceso de RTS</strong> (Return to Sender)</li>
<li>Si el paquete esta en un <strong>estado terminal</strong> (delivered o lost), el sistema solicita confirmacion al operador antes de proceder</li>
<li>Si el paquete <strong>pertenece a otra organizacion</strong>, se activa automaticamente un proceso de "take over"</li>
</ul>

<h3>Resultados del Escaneo en Reinbound</h3>
<table>
<tr><th>Resultado</th><th>Descripcion</th></tr>
<tr><td><strong>Exitoso (Successful)</strong></td><td>El paquete regresa al estado <code>warehouse</code> correctamente</td></tr>
<tr><td><strong>Missort</strong></td><td>El tracking number no existe en el sistema</td></tr>
<tr><td><strong>Wrong node</strong></td><td>El paquete pertenece a otro nodo/warehouse</td></tr>
<tr><td><strong>Wrong state</strong></td><td>El paquete esta en un estado que no permite reinbound</td></tr>
<tr><td><strong>Bloqueado (Blocked)</strong></td><td>El paquete tiene un bloqueo activo</td></tr>
<tr><td><strong>Too many attempts</strong></td><td>El paquete ha sido escaneado 4 o mas veces en el mismo nodo con razon de falla</td></tr>
<tr><td><strong>Duplicado (Duplicate)</strong></td><td>Ya fue escaneado en este reinbound</td></tr>
</table>

<h3>Proceso de Take Over</h3>
<div class="callout">
<strong>Take Over automatico:</strong> Cuando un paquete escaneado en reinbound pertenece a otra organizacion, el sistema ejecuta automaticamente las siguientes acciones:
</div>
<ul>
<li><strong>1.</strong> Cierra el envio en la organizacion del vendor como <code>not_delivered</code></li>
<li><strong>2.</strong> Reabre el envio en la organizacion del warehouse que esta recibiendo</li>
<li><strong>3.</strong> Agrega el nodo actual al path (ruta) del envio</li>
</ul>
<p>Este proceso permite que un warehouse reciba paquetes de terceros sin intervencion manual, transfiriendo la responsabilidad operativa de forma transparente.</p>

<h3>Regla de Too Many Attempts</h3>
<div class="callout warning">
<strong>Escalacion automatica:</strong> Cuando un paquete acumula 4 o mas escaneos en reinbound en el mismo nodo con una razon de falla, se marca como <code>too-many-attempts</code>. Esto indica que el paquete tiene un problema recurrente que no puede resolverse con intentos normales de entrega y requiere una <strong>escalacion manual</strong> por parte del equipo de operaciones.
</div>

<h2>RTS: Return to Sender</h2>
<p>El proceso de <strong>RTS (Return to Sender)</strong> es la operacion de devolucion de paquetes al remitente original. Es un proceso de <strong>3 etapas</strong> que garantiza la trazabilidad completa de cada devolucion.</p>

<h3>Etapa 1: Escaneo de Paquetes para Devolucion</h3>
<p>En esta primera fase:</p>
<ul>
<li>Se indica el <strong>tipo de pallet</strong> a utilizar: bueno (good) o dañado (damaged)</li>
<li>Se escanean los paquetes que seran devueltos</li>
<li>Para cada paquete, el sistema valida:
  <ul>
    <li>Que no este bloqueado</li>
    <li>Que el paquete se encuentre en el <strong>primer warehouse de la ruta</strong></li>
  </ul>
</li>
<li>Si existe un issue con la accion "Move to RTS", el sistema lo permite y cierra el issue</li>
<li>El estado del envio cambia a <code>pre_rts</code></li>
</ul>

<div class="callout">
<strong>Solo primer warehouse:</strong> El RTS unicamente puede realizarse desde el primer warehouse de la ruta del envio. Esto garantiza que la devolucion siga el camino logico inverso hacia el remitente.
</div>

<h3>Etapa 2: Generacion de Etiqueta de Pallet</h3>
<p>Una vez escaneados los paquetes, se genera una etiqueta para el pallet de devolucion que incluye:</p>
<ul>
<li><strong>Nombre del warehouse</strong> de origen</li>
<li><strong>Shortcode del shipper</strong> al que se devuelven los paquetes</li>
<li><strong>ID del pallet</strong> unico generado por el sistema</li>
</ul>

<h3>Etapa 3: Scan Out (Cierre)</h3>
<p>La etapa final es el cierre del proceso RTS:</p>
<ul>
<li><strong>Todos los envios</strong> del pallet cambian de <code>pre_rts</code> a <code>rts</code> de forma <strong>simultanea y atomica</strong></li>
<li>El bulk scan se marca como <code>completed</code></li>
<li>No se permiten mas modificaciones al proceso</li>
</ul>

<h3>Reglas Importantes del RTS</h3>
<table>
<tr><th>Regla</th><th>Descripcion</th></tr>
<tr><td>Solo primer warehouse</td><td>El RTS solo puede ejecutarse desde el primer warehouse en la ruta del envio</td></tr>
<tr><td>Bloqueo de despacho normal</td><td>Un envio en estado <code>pre_rts</code> no puede ser despachado en operaciones normales de last-mile o middle-mile</td></tr>
<tr><td>Excepcion por issues</td><td>Si un envio tiene un issue con la accion "Move to RTS", se permite el proceso y se cierra el issue automaticamente</td></tr>
<tr><td>Cierre atomico</td><td>El cambio de estado de <code>pre_rts</code> a <code>rts</code> es atomico: todos los envios del pallet cambian simultaneamente</td></tr>
<tr><td>Sin duplicados</td><td>Un paquete no puede escanearse dos veces en el mismo proceso RTS</td></tr>
<tr><td>Tipo de pallet</td><td>El tipo de pallet (bueno/danado) se registra como metadata en el historial del envio</td></tr>
</table>

<h2>Flujo de Estados Completo</h2>
<h3>Reinbound</h3>
<ul>
<li><code>dispatched</code> / <code>out_for_delivery</code> / <code>not_delivered</code> → <code>warehouse</code> (exitoso)</li>
<li>Cualquier estado terminal → <code>warehouse</code> (con confirmacion del operador)</li>
<li>Paquete de otra org → <code>not_delivered</code> en org original + <code>warehouse</code> en org receptora (Take Over automatico)</li>
</ul>

<h3>RTS</h3>
<ul>
<li><code>warehouse</code> → <code>pre_rts</code> (al escanear en Etapa 1)</li>
<li><code>pre_rts</code> → <code>rts</code> (al cerrar en Etapa 3, cambio atomico)</li>
</ul>
`,
    test: {
      questions: [
        {
          id: 'c4l3q1',
          question: 'Que diferencia fundamental tiene el reinbound respecto al inbound regular?',
          options: [
            { id: 'a', text: 'El reinbound no requiere indicar el warehouse', explanation: 'El reinbound si requiere indicar el warehouse, al igual que el inbound. La diferencia fundamental es la obligatoriedad de la razon de devolucion.' },
            { id: 'b', text: 'El reinbound siempre requiere una razon de devolucion para cada paquete' },
            { id: 'c', text: 'El reinbound solo acepta paquetes nuevos que nunca estuvieron en el sistema', explanation: 'Es lo contrario: el reinbound recibe paquetes que ya estuvieron en el sistema y regresan al warehouse tras un intento de entrega fallido u otra situacion.' },
            { id: 'd', text: 'El reinbound no genera historiales de escaneo', explanation: 'El reinbound si genera historiales de escaneo como cualquier otro tipo de bulk scan. La diferencia esta en la razon de devolucion obligatoria.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c4l3q2',
          question: 'Que sucede automaticamente cuando se escanea en reinbound un paquete que pertenece a otra organizacion?',
          options: [
            { id: 'a', text: 'Se rechaza el escaneo y se notifica a la organizacion propietaria', explanation: 'El escaneo no se rechaza. El sistema ejecuta automaticamente un Take Over que transfiere la responsabilidad sin rechazar el paquete.' },
            { id: 'b', text: 'Se ejecuta un Take Over: cierra el envio como not_delivered en la org original, lo reabre en la org receptora y agrega el nodo al path' },
            { id: 'c', text: 'Se registra como missort y requiere accion manual', explanation: 'Missort es cuando el tracking number no existe. Un paquete de otra organizacion si existe en el sistema, por lo que se procesa mediante Take Over automatico.' },
            { id: 'd', text: 'Se bloquea el paquete hasta que ambas organizaciones confirmen la transferencia', explanation: 'No se requiere confirmacion de ambas organizaciones. El Take Over es automatico y transfiere la responsabilidad de forma transparente sin intervencion manual.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c4l3q3',
          question: 'Despues de cuantos escaneos con razon de falla en el mismo nodo se marca un paquete como too-many-attempts?',
          options: [
            { id: 'a', text: '2 o mas escaneos', explanation: 'Dos escaneos no son suficientes para activar too-many-attempts. El umbral es de 4 o mas escaneos con razon de falla en el mismo nodo.' },
            { id: 'b', text: '3 o mas escaneos', explanation: 'Tres escaneos no alcanzan el umbral. Se necesitan 4 o mas escaneos en reinbound en el mismo nodo con razon de falla.' },
            { id: 'c', text: '4 o mas escaneos' },
            { id: 'd', text: '5 o mas escaneos', explanation: 'El umbral no es 5 sino 4 escaneos. Con 4 o mas escaneos con razon de falla en el mismo nodo ya se activa too-many-attempts.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c4l3q4',
          question: 'Cuantas etapas tiene el proceso de RTS y cuales son?',
          options: [
            { id: 'a', text: '2 etapas: escaneo de paquetes y cierre', explanation: 'El RTS tiene 3 etapas, no 2. Falta la etapa intermedia de generacion de etiqueta de pallet que ocurre entre el escaneo y el cierre.' },
            { id: 'b', text: '3 etapas: escaneo de paquetes, generacion de etiqueta de pallet y scan out (cierre)' },
            { id: 'c', text: '4 etapas: creacion, escaneo, validacion y cierre', explanation: 'El RTS tiene 3 etapas, no 4. Las etapas correctas son escaneo de paquetes, generacion de etiqueta de pallet y scan out.' },
            { id: 'd', text: '3 etapas: creacion, asignacion de conductor y despacho', explanation: 'Aunque son 3 etapas, estas no son las correctas. El RTS no involucra conductores. Las etapas son escaneo, generacion de etiqueta de pallet y scan out.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c4l3q6',
          question: 'Que significa que el cierre del RTS sea "atomico"?',
          options: [
            { id: 'a', text: 'Que cada paquete cambia de estado individualmente en orden secuencial', explanation: 'Atomico significa exactamente lo contrario: todos los envios cambian simultaneamente en una sola operacion, no de forma individual y secuencial.' },
            { id: 'b', text: 'Que todos los envios del pallet cambian de pre_rts a rts simultaneamente en una sola operacion' },
            { id: 'c', text: 'Que el sistema genera un respaldo antes de realizar el cambio', explanation: 'Atomico no se refiere a generar respaldos. Significa que la operacion ocurre como una unidad indivisible donde todos los cambios suceden simultaneamente.' },
            { id: 'd', text: 'Que solo el administrador puede ejecutar el cierre', explanation: 'Atomico no tiene relacion con permisos de usuario. Se refiere a que todos los envios del pallet cambian de estado simultaneamente sin estados intermedios.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c4l3q7',
          question: 'Que ocurre con un envio en estado pre_rts respecto al despacho normal?',
          options: [
            { id: 'a', text: 'Puede ser despachado normalmente sin restricciones', explanation: 'Un envio en pre_rts esta reservado para devolucion al remitente y tiene bloqueado el despacho normal para evitar conflictos con el proceso RTS.' },
            { id: 'b', text: 'No puede ser despachado en operaciones normales de last-mile o middle-mile' },
            { id: 'c', text: 'Solo puede ser despachado via middle-mile', explanation: 'Un envio en pre_rts no puede ser despachado por ninguna via normal, ni last-mile ni middle-mile. Esta reservado exclusivamente para el proceso de devolucion RTS.' },
            { id: 'd', text: 'Se despacha automaticamente al siguiente warehouse', explanation: 'Un envio en pre_rts no se despacha automaticamente. Permanece reservado para devolucion hasta que se complete el cierre atomico del RTS.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c4l3q8',
          question: 'Que informacion contiene la etiqueta de pallet generada en la Etapa 2 del RTS?',
          options: [
            { id: 'a', text: 'Lista completa de tracking numbers, peso total y dimensiones del pallet', explanation: 'La etiqueta no incluye la lista de tracking numbers ni detalles fisicos del pallet. Contiene nombre del warehouse, shortcode del shipper e ID del pallet.' },
            { id: 'b', text: 'Nombre del warehouse, shortcode del shipper e ID del pallet' },
            { id: 'c', text: 'Codigo QR con la ruta de devolucion y firma digital', explanation: 'La etiqueta de pallet RTS no contiene codigos QR ni firmas digitales. Incluye nombre del warehouse, shortcode del shipper e ID del pallet.' },
            { id: 'd', text: 'Solo el ID del pallet y la fecha de creacion', explanation: 'La etiqueta incluye mas que solo el ID: tambien contiene el nombre del warehouse de origen y el shortcode del shipper destinatario.' }
          ],
          correctOptionId: 'b'
        }
      ]
    }
  },
  // LESSON 4
  {
    title: 'Dispatch Last-Mile y Middle-Mile',
    order: 4,
    content: `
<h2>Dispatch Last-Mile</h2>
<p>El <strong>Dispatch Last-Mile</strong> es el proceso de despacho de paquetes para su entrega final al destinatario. Es una de las operaciones mas criticas del warehouse, ya que marca la transicion del paquete desde el almacen hacia la ultima etapa de la cadena logistica.</p>

<h3>Flujo del Dispatch Last-Mile</h3>

<h3>Paso 1: Creacion del Dispatch</h3>
<p>Se indica el <strong>nodo (warehouse)</strong> y la <strong>organizacion destino</strong>. El dispatch se crea con estado "not released", lo que significa que aun se pueden agregar o remover paquetes.</p>

<div class="callout">
<strong>Regla importante:</strong> Solo puede existir <strong>un dispatch pendiente</strong> por combinacion de nodo y organizacion. Si ya existe uno abierto para ese warehouse y esa organizacion, no se puede crear otro hasta que el primero se finalice.
</div>

<h3>Paso 2: Optimizacion de Ruta (Opcional)</h3>
<p>Antes de escanear paquetes, se puede optimizar la ruta de entrega:</p>
<ul>
<li>Se indica el <strong>conductor asignado</strong></li>
<li>Se definen los <strong>puntos de inicio y fin</strong> de la ruta</li>
<li>El sistema usa <strong>OSRM</strong> (Open Source Routing Machine) para calcular la ruta optima</li>
<li>Restricciones: minimo <strong>3 paradas</strong>, maximo <strong>250 paradas</strong> por ruta</li>
</ul>

<h3>Paso 3: Escaneo de Paquetes</h3>
<p>Se indica el <strong>conductor asignado</strong> y se comienzan a escanear los paquetes. Para cada escaneo se valida:</p>
<table>
<tr><th>Validacion</th><th>Descripcion</th></tr>
<tr><td>Tiempo de creacion</td><td>El dispatch debe tener menos de <strong>24 horas</strong> desde su creacion</td></tr>
<tr><td>Existencia del envio</td><td>El tracking number debe existir y corresponder al warehouse</td></tr>
<tr><td>Conductor valido</td><td>El conductor debe existir y tener el <strong>rol de driver</strong></td></tr>
<tr><td>Ruta de codigo postal</td><td>El codigo postal del envio debe tener una ruta configurada en el nodo para la organizacion</td></tr>
<tr><td>No bloqueado</td><td>El envio no debe tener bloqueos activos</td></tr>
<tr><td>No en RTS</td><td>El envio no debe estar en proceso de RTS</td></tr>
<tr><td>Envio abierto</td><td>El envio debe estar en un estado que permita despacho</td></tr>
</table>

<div class="callout warning">
<strong>Auto-correccion de estado:</strong> Si un envio esta aun en estado <code>order_received</code> al momento del escaneo de despacho, el sistema lo cambia automaticamente a <code>warehouse</code> antes de procesarlo como despacho. Esto cubre casos donde el paquete no paso por un inbound formal.
</div>

<h3>Paso 4: Finalizacion</h3>
<p>Al finalizar el dispatch, no se aceptan mas escaneos y el conductor puede iniciar su ruta de entrega.</p>

<h3>Resultados del Escaneo LM</h3>
<table>
<tr><th>Resultado</th><th>Accion</th></tr>
<tr><td><strong>Exitoso</strong></td><td>Estado cambia a <code>dispatched</code></td></tr>
<tr><td><strong>Bloqueado</strong></td><td>Registrado pero con issue adjunto</td></tr>
<tr><td><strong>Missort</strong></td><td>Tracking number no existe</td></tr>
<tr><td><strong>Wrong node</strong></td><td>Paquete no corresponde a este warehouse</td></tr>
<tr><td><strong>Wrong state</strong></td><td>Estado no permite despacho</td></tr>
<tr><td><strong>Duplicado</strong></td><td>Ya escaneado en este dispatch</td></tr>
</table>

<h3>Paquetes Overage</h3>
<p>Los paquetes que llevan mas de <strong>24 horas en el warehouse</strong> sin ser despachados se muestran como "overage" en una seccion separada. Esto ayuda a los operadores a identificar paquetes rezagados que requieren atencion prioritaria.</p>

<h2>Dispatch Middle-Mile</h2>
<p>El <strong>Dispatch Middle-Mile</strong> es el proceso de despacho de paquetes entre warehouses. A diferencia del last-mile, aqui el destino no es el cliente final sino otro centro de distribucion.</p>

<h3>Flujo del Dispatch Middle-Mile</h3>

<h3>Paso 1: Creacion del Dispatch</h3>
<p>Se indica el <strong>nodo de origen</strong> y la <strong>organizacion destino</strong> (que opera otro warehouse).</p>

<h3>Paso 2: Creacion de Pallets</h3>
<p>A diferencia del dispatch last-mile, el middle-mile agrupa paquetes en pallets:</p>
<ul>
<li>Se indica el <strong>tipo de pallet</strong>: madera (wood) o plastico (plastic)</li>
<li>El sistema genera un <strong>codigo de barras unico</strong> basado en el shortcode de la organizacion destino</li>
<li>El pallet se crea con estado <code>pending</code></li>
</ul>

<h3>Paso 3: Asignacion de Paquetes a Pallets</h3>
<p>Esta operacion se realiza desde la <strong>aplicacion Picoville</strong>:</p>
<ul>
<li>Se escanea el paquete y se indica a que pallet pertenece</li>
<li>Validaciones:
  <ul>
    <li>El envio debe estar en estado <code>warehouse</code></li>
    <li>El pallet debe existir en el dispatch</li>
    <li>El estado debe ser <code>warehouse</code> o <code>scanned_into_pallet</code> (permite reasignacion entre pallets)</li>
    <li>El codigo postal del envio debe corresponder a las rutas del destino</li>
  </ul>
</li>
<li>Al asignarse exitosamente, el estado cambia a <code>scanned_into_pallet</code></li>
</ul>

<h3>Paso 4: Scan Out del Pallet</h3>
<p>El cierre del pallet es la operacion final:</p>
<ul>
<li>El estado del pallet cambia de <code>pending</code> a <code>out</code></li>
<li>Se valida cada envio del pallet individualmente</li>
<li>Las validaciones fallidas de envios individuales <strong>no bloquean el proceso</strong> de los demas envios</li>
<li>Se crean <strong>tareas de procesamiento</strong> en background para los cambios de estado</li>
<li>La operacion es <strong>idempotente</strong>: ejecutarla multiples veces produce el mismo resultado</li>
</ul>

<h2>Diferencias Clave: Last-Mile vs Middle-Mile</h2>
<table>
<tr><th>Caracteristica</th><th>Last-Mile</th><th>Middle-Mile</th></tr>
<tr><td><strong>Destino</strong></td><td>Cliente final</td><td>Otro warehouse</td></tr>
<tr><td><strong>Agrupacion</strong></td><td>Por conductor</td><td>Por pallet</td></tr>
<tr><td><strong>Estado resultante</strong></td><td><code>dispatched</code></td><td><code>scanned_into_pallet</code></td></tr>
<tr><td><strong>Optimizacion de ruta</strong></td><td>Si (OSRM)</td><td>No aplica</td></tr>
<tr><td><strong>Conductor requerido</strong></td><td>Si, obligatorio</td><td>No requerido</td></tr>
<tr><td><strong>Limite de tiempo</strong></td><td>24 horas desde creacion</td><td>Sin limite</td></tr>
<tr><td><strong>App de escaneo</strong></td><td>Web/Scanner warehouse</td><td>Picoville</td></tr>
</table>

<h3>Flujo de Estados Middle-Mile</h3>
<pre>order_received -> warehouse (auto si necesario)
warehouse -> scanned_into_pallet (al asignar a pallet)
scanned_into_pallet -> dispatched (tarea en background despues de scan out)</pre>

<div class="callout">
<strong>Idempotencia del Scan Out:</strong> La operacion de scan out del pallet es idempotente, lo que significa que si se ejecuta multiples veces (por ejemplo, por un error de red o un reintento del operador), el resultado sera exactamente el mismo sin duplicar acciones ni generar inconsistencias en los datos.
</div>
`,
    test: {
      questions: [
        {
          id: 'c4l4q1',
          question: 'Cual es el limite de tiempo para un dispatch last-mile desde su creacion?',
          options: [
            { id: 'a', text: '12 horas', explanation: 'El limite no es 12 horas. El dispatch last-mile permite escaneos hasta 24 horas despues de su creacion.' },
            { id: 'b', text: '24 horas' },
            { id: 'c', text: '48 horas', explanation: 'El limite no es 48 horas sino 24 horas. Pasado ese tiempo, el dispatch ya no acepta nuevos escaneos.' },
            { id: 'd', text: 'No tiene limite de tiempo', explanation: 'El dispatch last-mile si tiene un limite de tiempo de 24 horas desde su creacion. A diferencia del middle-mile, que no tiene limite.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c4l4q2',
          question: 'Que sucede si un envio esta en estado order_received al momento de escanearlo en un dispatch last-mile?',
          options: [
            { id: 'a', text: 'Se rechaza el escaneo por estado invalido', explanation: 'El escaneo no se rechaza. El sistema aplica una auto-correccion cambiando el estado a warehouse antes de procesar el despacho.' },
            { id: 'b', text: 'Se registra como missort', explanation: 'Missort ocurre cuando el tracking number no existe. Un envio en order_received si existe, y el sistema lo corrige automaticamente a warehouse.' },
            { id: 'c', text: 'El sistema lo cambia automaticamente a warehouse antes de procesarlo como despacho' },
            { id: 'd', text: 'Se marca como bloqueado hasta que pase por inbound', explanation: 'El sistema no bloquea el envio ni exige un inbound formal. Aplica una auto-correccion de estado directamente a warehouse para permitir el despacho.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c4l4q3',
          question: 'En el dispatch middle-mile, desde que aplicacion se asignan los paquetes a los pallets?',
          options: [
            { id: 'a', text: 'Desde el panel web de administracion', explanation: 'La asignacion de paquetes a pallets en middle-mile no se hace desde el panel web sino desde la aplicacion Picoville.' },
            { id: 'b', text: 'Desde la aplicacion SyncPod', explanation: 'SyncPod no es la aplicacion utilizada para asignar paquetes a pallets en middle-mile. La aplicacion correcta es Picoville.' },
            { id: 'c', text: 'Desde la aplicacion Picoville' },
            { id: 'd', text: 'Desde cualquier scanner conectado al sistema', explanation: 'No se puede usar cualquier scanner. La asignacion de paquetes a pallets en middle-mile se realiza especificamente desde la aplicacion Picoville.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c4l4q4',
          question: 'Cual es el estado intermedio de un paquete asignado a un pallet en middle-mile antes del scan out?',
          options: [
            { id: 'a', text: 'dispatched', explanation: 'Dispatched es el estado final despues del scan out del pallet, no el estado intermedio durante la asignacion.' },
            { id: 'b', text: 'warehouse', explanation: 'Warehouse es el estado previo del paquete antes de ser asignado a un pallet. Al asignarse, cambia a scanned_into_pallet.' },
            { id: 'c', text: 'pre_dispatch', explanation: 'pre_dispatch no es un estado del flujo de middle-mile. El estado intermedio correcto es scanned_into_pallet.' },
            { id: 'd', text: 'scanned_into_pallet' }
          ],
          correctOptionId: 'd'
        },
        {
          id: 'c4l4q5',
          question: 'Cuantos dispatches pendientes pueden existir simultaneamente para la misma combinacion de nodo y organizacion en last-mile?',
          options: [
            { id: 'a', text: 'Ilimitados', explanation: 'No pueden existir dispatches ilimitados. El sistema restringe a solo 1 dispatch pendiente por combinacion de nodo y organizacion.' },
            { id: 'b', text: 'Maximo 3', explanation: 'El limite no es 3. Solo puede existir 1 dispatch pendiente por combinacion de nodo y organizacion hasta que se finalice.' },
            { id: 'c', text: 'Solo 1' },
            { id: 'd', text: 'Maximo 5', explanation: 'El limite no es 5. La regla es estricta: solo 1 dispatch pendiente por combinacion de nodo y organizacion.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c4l4q6',
          question: 'Que significa que la operacion de scan out del pallet sea "idempotente"?',
          options: [
            { id: 'a', text: 'Que solo puede ejecutarse una unica vez por pallet', explanation: 'Idempotente no significa que solo se ejecuta una vez. Al contrario, puede ejecutarse multiples veces y siempre producira el mismo resultado.' },
            { id: 'b', text: 'Que ejecutarla multiples veces produce el mismo resultado sin duplicar acciones' },
            { id: 'c', text: 'Que requiere autorizacion del administrador para cada ejecucion', explanation: 'Idempotente no tiene relacion con permisos o autorizaciones. Es una propiedad tecnica que garantiza que repetir la operacion no genera efectos secundarios.' },
            { id: 'd', text: 'Que se ejecuta automaticamente sin intervencion del operador', explanation: 'Idempotente no significa automatico. Se refiere a que si la operacion se ejecuta multiples veces, el resultado es siempre el mismo sin inconsistencias.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c4l4q7',
          question: 'Cual es el rango de paradas permitido para la optimizacion de ruta OSRM en last-mile?',
          options: [
            { id: 'a', text: 'Minimo 1, maximo 100 paradas', explanation: 'El minimo no es 1 sino 3 paradas, y el maximo no es 100 sino 250 paradas para la optimizacion OSRM.' },
            { id: 'b', text: 'Minimo 5, maximo 500 paradas', explanation: 'El minimo no es 5 sino 3 paradas, y el maximo no es 500 sino 250 paradas para la optimizacion OSRM.' },
            { id: 'c', text: 'Minimo 3, maximo 250 paradas' },
            { id: 'd', text: 'Minimo 10, maximo 200 paradas', explanation: 'El minimo no es 10 sino 3 paradas, y el maximo no es 200 sino 250 paradas para la optimizacion OSRM.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c4l4q8',
          question: 'Que ocurre cuando una validacion individual de un envio falla durante el scan out de un pallet en middle-mile?',
          options: [
            { id: 'a', text: 'Se cancela el scan out completo del pallet', explanation: 'El scan out no se cancela por una validacion individual fallida. Los demas envios del pallet se procesan normalmente.' },
            { id: 'b', text: 'Se bloquea el pallet hasta resolver todas las validaciones', explanation: 'El pallet no se bloquea por validaciones individuales fallidas. El proceso continua para los demas envios sin interrupcion.' },
            { id: 'c', text: 'La validacion fallida no bloquea el proceso de los demas envios del pallet' },
            { id: 'd', text: 'Se remueve automaticamente el envio problematico del pallet', explanation: 'El envio no se remueve automaticamente del pallet. La validacion fallida simplemente no bloquea el procesamiento de los otros envios.' }
          ],
          correctOptionId: 'c'
        }
      ]
    }
  },
  // LESSON 5
  {
    title: 'Inventario y Flex Reception',
    order: 5,
    content: `
<h2>Inventario de Envios (Shipment Inventory)</h2>
<p>El <strong>inventario de envios</strong> es un proceso de conteo ciclico (cycle count) que permite verificar que los paquetes que el sistema indica como presentes en el warehouse realmente estan ahi fisicamente. Al crearse, el sistema genera una lista de todos los envios que <strong>deberian estar</strong> en el warehouse, marcandolos inicialmente como <code>not-found</code>.</p>

<h3>Resultados del Escaneo de Inventario</h3>
<table>
<tr><th>Resultado</th><th>Condicion</th><th>Accion</th></tr>
<tr><td><strong>Success (Confirmado)</strong></td><td>El envio esta en estado <code>warehouse</code> y pertenece al nodo correcto</td><td>Se marca como confirmado en el inventario</td></tr>
<tr><td><strong>Overage</strong></td><td>El envio esta en otro nodo o en un estado diferente a warehouse</td><td>Se ejecuta un <strong>take over automatico</strong> que transfiere el envio a este warehouse</td></tr>
<tr><td><strong>Already scanned</strong></td><td>El envio ya fue escaneado en este inventario</td><td>Sin cambio, se ignora</td></tr>
</table>

<div class="callout">
<strong>Take Over en inventario:</strong> Cuando se escanea un paquete que segun el sistema esta en otro nodo o estado, el inventario ejecuta automaticamente un take over, transfiriendo la propiedad del envio al warehouse actual. Esto permite corregir discrepancias entre el inventario fisico y el digital sin intervencion manual.
</div>

<h3>Proceso de Limpieza (Cleanup)</h3>
<p>Al finalizar el inventario, el sistema ejecuta un proceso de limpieza que <strong>elimina los registros not-found de envios que ya avanzaron de estado</strong>. Por ejemplo, si un envio fue despachado durante el proceso de inventario, su registro not-found se elimina automaticamente ya que el paquete salio legitimamente del warehouse.</p>

<h3>Reglas del Inventario de Envios</h3>
<ul>
<li><strong>Take over automatico:</strong> Los paquetes encontrados fisicamente pero registrados en otro nodo se transfieren automaticamente</li>
<li><strong>Sin envios RTS:</strong> Los envios en proceso de RTS no se incluyen en el inventario</li>
<li><strong>Envio abierto:</strong> Solo se consideran envios con estado abierto (no cerrados, no cancelados)</li>
<li><strong>Limpieza inteligente:</strong> Los registros not-found se depuran si el envio ya cambio de estado legitimamente</li>
</ul>

<h2>Inventario de Productos (Product Inventory)</h2>
<p>El <strong>inventario de productos</strong> opera a nivel de caja y stock, no a nivel de envio individual. En lugar de escanear tracking numbers, se escanean <strong>referencias internas</strong> del almacen.</p>

<h3>Caso A: La Caja Existe en el Sistema</h3>
<p>Cuando se escanea una referencia interna que el sistema ya conoce:</p>
<table>
<tr><th>Resultado</th><th>Descripcion</th></tr>
<tr><td><strong>Success</strong></td><td>La caja era esperada en este warehouse - se confirma su presencia</td></tr>
<tr><td><strong>Overage</strong></td><td>La caja no era esperada en este nodo - se registra como excedente</td></tr>
<tr><td><strong>Already scanned</strong></td><td>Ya fue escaneada en este inventario - sin cambio</td></tr>
</table>

<h3>Caso B: La Caja No Existe en el Sistema</h3>
<p>Cuando se escanea una referencia que no tiene registro previo, el proceso requiere <strong>dos escaneos</strong>:</p>
<ul>
<li><strong>Primer escaneo:</strong> El sistema detecta que la referencia no existe y solicita al operador que ingrese el <strong>SKU</strong> (Stock Keeping Unit) del producto</li>
<li><strong>Segundo escaneo:</strong> El sistema valida el SKU ingresado, <strong>crea automaticamente una entrada de stock</strong> para esa referencia y la registra como <code>overage</code></li>
</ul>

<div class="callout warning">
<strong>Doble escaneo para cajas desconocidas:</strong> Este mecanismo de dos pasos asegura que toda caja fisica encontrada durante el inventario quede registrada en el sistema con su SKU correcto, incluso si nunca fue dada de alta previamente. Es un mecanismo de auto-correccion del inventario.
</div>

<h3>Diferencias: Inventario de Envios vs Inventario de Productos</h3>
<table>
<tr><th>Caracteristica</th><th>Inventario de Envios</th><th>Inventario de Productos</th></tr>
<tr><td><strong>Que se escanea</strong></td><td>Tracking numbers de envios</td><td>Referencias internas de cajas/stock</td></tr>
<tr><td><strong>Que se verifica</strong></td><td>Envios (shipments)</td><td>Cajas y stock</td></tr>
<tr><td><strong>Overage</strong></td><td>Take over automatico del envio</td><td>Crea entrada de stock con SKU (2 pasos)</td></tr>
<tr><td><strong>Cambio de estado</strong></td><td>Si, puede cambiar estado del envio</td><td>No cambia estado de envios</td></tr>
<tr><td><strong>Alcance</strong></td><td>Todos los envios del warehouse</td><td>Stock por nodo especifico</td></tr>
</table>

<h2>Recepcion de Ruta Flex (Flex Route Reception)</h2>
<p>La <strong>recepcion de ruta flex</strong> es el proceso de recibir de vuelta los paquetes que no fueron entregados en una ruta flex. Reutiliza la logica del reinbound pero con reglas especificas para rutas flex.</p>

<h3>Flujo de Recepcion Flex</h3>

<h3>Paso 1: Seleccion de Ruta Flex</h3>
<ul>
<li>Se selecciona la ruta flex de la cual se reciben paquetes</li>
<li>El sistema obtiene todos los envios abiertos de esa ruta</li>
<li>Se crea una lista con estado <code>not-found</code> para cada envio</li>
<li>El estado de la ruta cambia a <code>RETURN_TO_WAREHOUSE</code></li>
</ul>

<h3>Paso 2: Escaneo de Paquetes</h3>
<ul>
<li>Se escanean los paquetes con <strong>razon de devolucion obligatoria</strong></li>
<li><strong>Solo se aceptan paquetes de la ruta flex seleccionada</strong> - cualquier otro paquete es rechazado</li>
<li>Cada paquete escaneado se marca como recibido en la lista</li>
</ul>

<h3>Paso 3: Cierre de Recepcion</h3>
<ul>
<li>Al cerrar la recepcion, el estado de la ruta cambia a <code>COMPLETED</code></li>
<li>Los paquetes no escaneados quedan registrados como <code>not-found</code> para investigacion</li>
</ul>

<h2>Dispatch de Ruta Flex</h2>
<p>Complementando la recepcion, tambien existe el proceso de <strong>despacho de ruta flex</strong> para enviar paquetes a traves de conductores flex.</p>

<h3>Flujo del Dispatch Flex</h3>

<h3>Paso 1: Seleccion de Ruta</h3>
<ul>
<li>Se selecciona una ruta flex en estado <code>ASSIGNED</code></li>
<li>El sistema obtiene los tracking numbers de las paradas (stops) de la ruta</li>
</ul>

<h3>Paso 2: Escaneo y Asignacion</h3>
<ul>
<li>Se escanean los paquetes y se asigna el conductor</li>
<li>Los datos se replican a <strong>SyncFlex</strong> (plataforma de conductores flex)</li>
<li><strong>Solo se aceptan paquetes de la ruta seleccionada</strong></li>
</ul>

<h3>Paso 3: Reporte de Discrepancias</h3>
<p>Durante el escaneo, se pueden reportar discrepancias sobre los paquetes:</p>
<ul>
<li><strong>Faltante (missing):</strong> El paquete deberia estar pero no se encuentra</li>
<li><strong>Dañado (damaged):</strong> El paquete esta dañado</li>
<li><strong>Articulo incorrecto (wrong item):</strong> El contenido no corresponde</li>
</ul>

<h3>Paso 4: Finalizacion</h3>
<p>Para los paquetes problematicos, el operador decide entre dos opciones:</p>
<ul>
<li><strong>Devolver al warehouse:</strong> El paquete no sale con el conductor</li>
<li><strong>Continuar con el conductor:</strong> El paquete sale a pesar del problema reportado</li>
</ul>

<div class="callout">
<strong>Re-optimizacion automatica:</strong> Si existen paquetes marcados para devolucion al warehouse, el sistema <strong>re-optimiza automaticamente la ruta</strong> del conductor, eliminando las paradas de los paquetes devueltos y recalculando el orden optimo de entrega.
</div>

<h3>Estados de la Ruta Flex tras el Dispatch</h3>
<table>
<tr><th>Elemento</th><th>Estado resultante</th></tr>
<tr><td>Ruta flex</td><td><code>IN_PROGRESS</code></td></tr>
<tr><td>Envios despachados</td><td><code>out_for_delivery</code> en la organizacion destino</td></tr>
<tr><td>Paquetes devueltos</td><td>Permanecen en <code>warehouse</code></td></tr>
</table>

<h2>Resumen de Operaciones por Tipo de Bulk Scan</h2>
<table>
<tr><th>Operacion</th><th>Entrada</th><th>Salida</th><th>Caracteristica unica</th></tr>
<tr><td>Inventario envios</td><td>Lista auto-generada</td><td>Confirmados + not-found</td><td>Take over automatico</td></tr>
<tr><td>Inventario productos</td><td>Referencias internas</td><td>Confirmados + overage</td><td>Doble escaneo para cajas nuevas</td></tr>
<tr><td>Recepcion flex</td><td>Paquetes de ruta flex</td><td>Recibidos + not-found</td><td>Solo acepta paquetes de la ruta</td></tr>
<tr><td>Dispatch flex</td><td>Paquetes de ruta ASSIGNED</td><td>Despachados + devueltos</td><td>Re-optimizacion automatica de ruta</td></tr>
</table>
`,
    test: {
      questions: [
        {
          id: 'c4l5q1',
          question: 'Que sucede cuando se escanea un paquete en inventario de envios que segun el sistema esta en otro nodo?',
          options: [
            { id: 'a', text: 'Se registra como error y se descarta el escaneo', explanation: 'El escaneo no se descarta. El sistema registra el paquete como overage y ejecuta un take over automatico para corregir la discrepancia.' },
            { id: 'b', text: 'Se ejecuta un take over automatico que transfiere el envio al warehouse actual' },
            { id: 'c', text: 'Se bloquea el paquete hasta que se investigue la discrepancia', explanation: 'El paquete no se bloquea. El sistema corrige la discrepancia automaticamente mediante un take over que transfiere el envio al warehouse actual.' },
            { id: 'd', text: 'Se notifica al warehouse original para que actualice sus registros', explanation: 'No se envia una notificacion para actualizacion manual. El take over automatico transfiere la propiedad del envio sin intervencion de otro warehouse.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c4l5q2',
          question: 'En el inventario de productos, que ocurre cuando se escanea una referencia que no existe en el sistema?',
          options: [
            { id: 'a', text: 'Se rechaza el escaneo automaticamente', explanation: 'El escaneo no se rechaza. El sistema inicia un proceso de doble escaneo para registrar la caja desconocida con su SKU correcto.' },
            { id: 'b', text: 'Se crea una entrada de stock automaticamente con un SKU generico', explanation: 'No se usa un SKU generico. El sistema solicita al operador que ingrese el SKU correcto en el primer escaneo antes de crear la entrada.' },
            { id: 'c', text: 'Requiere dos escaneos: el primero solicita el SKU, el segundo valida y crea la entrada de stock como overage' },
            { id: 'd', text: 'Se registra como missort y se ignora', explanation: 'En inventario de productos no existe el concepto de missort. Las referencias desconocidas se procesan mediante doble escaneo para registrarlas con su SKU.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c4l5q3',
          question: 'Que hace el proceso de limpieza (cleanup) al finalizar un inventario de envios?',
          options: [
            { id: 'a', text: 'Elimina todos los registros del inventario para liberar espacio', explanation: 'El cleanup no elimina todos los registros, solo los not-found de envios que avanzaron de estado legitimamente. Los demas registros se conservan.' },
            { id: 'b', text: 'Elimina los registros not-found de envios que ya avanzaron de estado legitimamente' },
            { id: 'c', text: 'Marca todos los envios not-found como perdidos automaticamente', explanation: 'El cleanup no marca envios como perdidos. Solo elimina los registros not-found de envios que legitimamente salieron del warehouse durante el inventario.' },
            { id: 'd', text: 'Genera un reporte PDF con los resultados del inventario', explanation: 'El proceso de cleanup no genera reportes. Su funcion es depurar los registros not-found de envios que cambiaron de estado durante el inventario.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c4l5q4',
          question: 'A que estado cambia la ruta flex cuando se inicia la recepcion de paquetes devueltos?',
          options: [
            { id: 'a', text: 'COMPLETED', explanation: 'COMPLETED es el estado al que cambia la ruta cuando se cierra la recepcion, no cuando se inicia. Al iniciar cambia a RETURN_TO_WAREHOUSE.' },
            { id: 'b', text: 'IN_PROGRESS', explanation: 'IN_PROGRESS es el estado de la ruta flex durante el despacho de paquetes, no durante la recepcion de devueltos.' },
            { id: 'c', text: 'RETURN_TO_WAREHOUSE' },
            { id: 'd', text: 'CANCELLED', explanation: 'CANCELLED indicaria que la ruta fue cancelada. Al iniciar la recepcion de devueltos, el estado correcto es RETURN_TO_WAREHOUSE.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c4l5q5',
          question: 'Que sucede automaticamente cuando hay paquetes devueltos al warehouse durante un dispatch flex?',
          options: [
            { id: 'a', text: 'Se cancela la ruta completa del conductor', explanation: 'La ruta no se cancela. Solo se eliminan las paradas de los paquetes devueltos y se re-optimiza la ruta con las paradas restantes.' },
            { id: 'b', text: 'El sistema re-optimiza automaticamente la ruta eliminando las paradas de paquetes devueltos' },
            { id: 'c', text: 'Se asigna un nuevo conductor para los paquetes restantes', explanation: 'No se asigna un nuevo conductor. El mismo conductor mantiene su ruta, pero re-optimizada sin las paradas de los paquetes devueltos.' },
            { id: 'd', text: 'Los paquetes devueltos se agregan a la proxima ruta disponible', explanation: 'Los paquetes devueltos permanecen en el warehouse, no se agregan a otra ruta. La ruta actual se re-optimiza sin esas paradas.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c4l5q6',
          question: 'Que tipos de discrepancias se pueden reportar durante un dispatch flex?',
          options: [
            { id: 'a', text: 'Solo paquetes faltantes', explanation: 'Faltante es solo uno de los tres tipos. Tambien se pueden reportar paquetes dañados y articulos incorrectos.' },
            { id: 'b', text: 'Faltante (missing), dañado (damaged) y articulo incorrecto (wrong item)' },
            { id: 'c', text: 'Dañado, perdido y duplicado', explanation: 'Perdido y duplicado no son tipos de discrepancia en dispatch flex. Los tres tipos son faltante (missing), dañado (damaged) y articulo incorrecto (wrong item).' },
            { id: 'd', text: 'Missort, bloqueado y wrong state', explanation: 'Estos son resultados de escaneo de inbound y dispatch, no tipos de discrepancia de dispatch flex. Los correctos son faltante, dañado y articulo incorrecto.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c4l5q7',
          question: 'Cual es la diferencia principal entre lo que se escanea en un inventario de envios vs un inventario de productos?',
          options: [
            { id: 'a', text: 'Ambos escanean tracking numbers pero verifican cosas diferentes', explanation: 'No ambos escanean tracking numbers. El inventario de productos escanea referencias internas de cajas/stock, no tracking numbers.' },
            { id: 'b', text: 'El de envios escanea tracking numbers; el de productos escanea referencias internas de cajas/stock' },
            { id: 'c', text: 'El de productos escanea codigos QR y el de envios escanea codigos de barras', explanation: 'La diferencia no es el formato del codigo sino lo que representan: tracking numbers para envios y referencias internas para productos.' },
            { id: 'd', text: 'No hay diferencia, ambos usan el mismo tipo de codigo', explanation: 'Si hay diferencia: el de envios escanea tracking numbers de shipments y el de productos escanea referencias internas de cajas/stock.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c4l5q8',
          question: 'En la recepcion flex, que paquetes acepta el sistema durante el escaneo?',
          options: [
            { id: 'a', text: 'Cualquier paquete que este en estado warehouse', explanation: 'No acepta cualquier paquete en estado warehouse. Solo acepta paquetes especificos de la ruta flex seleccionada, rechazando cualquier otro.' },
            { id: 'b', text: 'Cualquier paquete de la organizacion, sin importar la ruta', explanation: 'No acepta paquetes de cualquier ruta. Esta estrictamente limitado a los paquetes de la ruta flex seleccionada al inicio del proceso.' },
            { id: 'c', text: 'Solo paquetes que pertenecen a la ruta flex seleccionada' },
            { id: 'd', text: 'Paquetes de cualquier ruta flex que este en estado RETURN_TO_WAREHOUSE', explanation: 'No acepta paquetes de cualquier ruta en RETURN_TO_WAREHOUSE. Solo acepta los de la ruta flex especifica que fue seleccionada al crear la recepcion.' }
          ],
          correctOptionId: 'c'
        }
      ]
    }
  }
];
