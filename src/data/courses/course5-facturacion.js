export const course5Data = {
  title: 'Facturacion e Invoicing',
  description: 'Comprende el sistema de facturacion: ciclo de vida de facturas, rate plans, bloques de pricing, calculos y actividades facturables.',
  order: 5,
  published: true,
  totalLessons: 5
};

export const course5Lessons = [
  {
    title: 'Ciclo de Vida de Facturas',
    order: 1,
    content: `
      <h2>Ciclo de Vida de Facturas</h2>
      <p>
        El sistema de facturacion de SyncFreight gestiona todo el proceso desde la generacion de una factura
        hasta su pago final. Cada factura atraviesa una serie de estados bien definidos, y cada transicion
        queda registrada en un <strong>audit trail</strong> con timestamp y usuario responsable.
      </p>

      <h3>Estados de una Factura</h3>
      <p>Una factura puede encontrarse en uno de tres estados:</p>
      <table>
        <thead>
          <tr>
            <th>Estado</th>
            <th>Descripcion</th>
            <th>Acciones Disponibles</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>CREATED</strong></td>
            <td>La factura ha sido generada, ya sea de forma manual o automatica mediante un cron job. Se encuentra en estado inicial y puede ser revisada y modificada.</td>
            <td>Aprobar (pasar a APPROVED), editar, agregar o quitar actividades</td>
          </tr>
          <tr>
            <td><strong>APPROVED</strong></td>
            <td>La factura ha sido revisada y aprobada por un administrador. Esta lista para ser pagada.</td>
            <td>Marcar como pagada (pasar a PAID), revertir a CREATED si se requieren ajustes</td>
          </tr>
          <tr>
            <td><strong>PAID</strong></td>
            <td>La factura ha sido pagada. Este es el estado terminal. Se registra el numero de confirmacion del pago.</td>
            <td>Ninguna (estado final)</td>
          </tr>
        </tbody>
      </table>

      <h3>Flujo de Transiciones</h3>
      <p>El flujo normal de una factura sigue esta secuencia:</p>
      <pre>CREATED  -->  APPROVED  -->  PAID</pre>
      <p>
        Sin embargo, existe una transicion especial: una factura en estado <strong>APPROVED</strong> puede
        ser revertida a <strong>CREATED</strong> si se detecta que requiere ajustes o correcciones antes de
        proceder al pago.
      </p>

      <div class="callout">
        <strong>Concepto clave:</strong> Cada cambio de estado se registra en un audit trail que incluye
        el timestamp exacto de la transicion y el usuario que la realizo. Esto garantiza trazabilidad
        completa del proceso de facturacion.
      </div>

      <h3>Generacion Automatica de Facturas</h3>
      <p>
        Las facturas pueden generarse automaticamente mediante <strong>cron jobs</strong> configurados por
        organizacion a traves de <strong>Google Cloud Scheduler</strong>. El proceso automatico sigue estos pasos:
      </p>
      <ol>
        <li><strong>Consulta de actividades pendientes:</strong> El sistema busca todas las actividades facturables (billable activities) que aun no tienen una factura asignada (sin <code>invoiceId</code>).</li>
        <li><strong>Agrupacion y calculo:</strong> Las actividades se agrupan segun los criterios configurados y se calculan los totales correspondientes.</li>
        <li><strong>Creacion de la factura:</strong> Se genera una nueva factura en estado <code>CREATED</code> con todos los totales calculados.</li>
        <li><strong>Asignacion de invoiceId:</strong> Cada actividad incluida en la factura recibe el <code>invoiceId</code> correspondiente, vinculandola permanentemente a esa factura.</li>
      </ol>

      <div class="callout warning">
        <strong>Importante:</strong> Una vez que una actividad facturable recibe un <code>invoiceId</code>,
        queda asociada a esa factura. Si se necesita modificar, se debe revertir la factura a estado
        CREATED o generar una actividad de ajuste.
      </div>

      <h3>Exportacion CSV</h3>
      <p>
        El sistema permite exportar facturas en formato CSV para integracion con sistemas contables externos.
        El archivo CSV contiene las siguientes secciones:
      </p>
      <ul>
        <li><strong>Header:</strong> Informacion general de la factura (numero, fecha, organizacion, periodo)</li>
        <li><strong>Deliveries:</strong> Detalle de todas las entregas facturadas</li>
        <li><strong>Adjustments:</strong> Ajustes manuales aplicados</li>
        <li><strong>Reversals:</strong> Reversiones de entregas</li>
        <li><strong>Deductions:</strong> Deducciones aplicadas (penalidades, descuentos)</li>
        <li><strong>Associated Costs:</strong> Costos asociados (operacionales de warehouse)</li>
        <li><strong>Vehicle Services:</strong> Servicios de vehiculos realizados</li>
      </ul>

      <h3>Numero de Confirmacion de Pago</h3>
      <p>
        Cuando una factura pasa al estado <strong>PAID</strong>, se registra el numero de confirmacion
        del pago (<code>paymentConfirmationNumber</code>). Este dato es obligatorio para completar la
        transicion y sirve como referencia cruzada con el sistema de pagos externo.
      </p>
    `,
    test: {
      questions: [
        {
          id: 'c5l1q1',
          question: 'Cuales son los tres estados posibles de una factura en el sistema?',
          options: [
            { id: 'a', text: 'CREATED, APPROVED, PAID' },
            { id: 'b', text: 'DRAFT, PENDING, COMPLETED', explanation: 'Estos nombres no corresponden a los estados del sistema. Los estados correctos son CREATED, APPROVED y PAID.' },
            { id: 'c', text: 'NEW, PROCESSING, CLOSED', explanation: 'Estos nombres no existen en el sistema de facturacion. Los estados definidos son CREATED, APPROVED y PAID.' },
            { id: 'd', text: 'OPEN, REVIEWED, SETTLED', explanation: 'Estos terminos no son los estados del sistema. Los tres estados reales son CREATED, APPROVED y PAID.' }
          ],
          correctOptionId: 'a'
        },
        {
          id: 'c5l1q2',
          question: 'Que estado es terminal y no permite mas transiciones?',
          options: [
            { id: 'a', text: 'CREATED', explanation: 'CREATED no es terminal porque permite transicionar a APPROVED. Es el estado inicial donde la factura puede ser editada.' },
            { id: 'b', text: 'APPROVED', explanation: 'APPROVED no es terminal porque permite transicionar a PAID o revertirse a CREATED si se requieren ajustes.' },
            { id: 'c', text: 'PAID' },
            { id: 'd', text: 'Ninguno, todos permiten transiciones', explanation: 'Esto es incorrecto porque PAID es un estado terminal que no permite mas transiciones una vez registrado el pago.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c5l1q3',
          question: 'Es posible revertir una factura de APPROVED a CREATED?',
          options: [
            { id: 'a', text: 'No, las transiciones son siempre hacia adelante', explanation: 'Esto es incorrecto porque el sistema si permite revertir de APPROVED a CREATED cuando se necesitan ajustes o correcciones.' },
            { id: 'b', text: 'Si, se puede revertir si se requieren ajustes' },
            { id: 'c', text: 'Solo si la factura tiene menos de 24 horas', explanation: 'No existe restriccion de tiempo para revertir una factura de APPROVED a CREATED. La reversion esta disponible sin limites temporales.' },
            { id: 'd', text: 'Solo si un superadmin lo autoriza', explanation: 'No se requiere autorizacion de un superadmin para revertir. Cualquier usuario con permisos puede realizar la reversion.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c5l1q4',
          question: 'Cual es el primer paso del proceso automatico de generacion de facturas?',
          options: [
            { id: 'a', text: 'Crear la factura en estado CREATED', explanation: 'La creacion de la factura no es el primer paso sino uno posterior. Primero se deben consultar las actividades pendientes para saber que incluir.' },
            { id: 'b', text: 'Enviar notificacion al administrador', explanation: 'El proceso automatico no comienza con una notificacion. Inicia consultando las actividades facturables pendientes sin factura asignada.' },
            { id: 'c', text: 'Consultar todas las actividades facturables pendientes sin factura asignada' },
            { id: 'd', text: 'Calcular el total de la factura', explanation: 'El calculo del total ocurre despues de consultar y agrupar las actividades. No puede calcularse sin antes identificar que actividades incluir.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c5l1q5',
          question: 'Que herramienta se utiliza para programar los cron jobs de generacion automatica?',
          options: [
            { id: 'a', text: 'Firebase Cloud Functions', explanation: 'Firebase Cloud Functions no se usa para la programacion de cron jobs. El servicio utilizado es Google Cloud Scheduler.' },
            { id: 'b', text: 'Google Cloud Scheduler' },
            { id: 'c', text: 'AWS Lambda', explanation: 'AWS Lambda es un servicio de Amazon, no de Google. El sistema utiliza Google Cloud Scheduler para programar los cron jobs.' },
            { id: 'd', text: 'Node-cron local', explanation: 'No se usa una libreria local como node-cron. La programacion se realiza mediante Google Cloud Scheduler, un servicio gestionado en la nube.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c5l1q6',
          question: 'Que informacion se registra en el audit trail de cada transicion de estado?',
          options: [
            { id: 'a', text: 'Solo el nuevo estado', explanation: 'Registrar solo el nuevo estado seria insuficiente para auditoria. El audit trail incluye tanto el timestamp como el usuario responsable del cambio.' },
            { id: 'b', text: 'El timestamp y el usuario que realizo el cambio' },
            { id: 'c', text: 'Solo la fecha del cambio', explanation: 'Registrar solo la fecha no proporciona trazabilidad completa. El audit trail tambien incluye el usuario que realizo la transicion.' },
            { id: 'd', text: 'El monto total de la factura', explanation: 'El monto total no forma parte del audit trail de transiciones de estado. Lo que se registra es el timestamp y el usuario responsable del cambio.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c5l1q7',
          question: 'Que dato es obligatorio al marcar una factura como PAID?',
          options: [
            { id: 'a', text: 'La firma digital del administrador', explanation: 'No se requiere firma digital para marcar una factura como PAID. El dato obligatorio es el numero de confirmacion del pago.' },
            { id: 'b', text: 'El numero de confirmacion del pago' },
            { id: 'c', text: 'La aprobacion de dos usuarios', explanation: 'No existe un requisito de doble aprobacion para el pago. Solo se necesita el numero de confirmacion del pago.' },
            { id: 'd', text: 'El escaneo del recibo fisico', explanation: 'El sistema no requiere escaneo de documentos fisicos. Lo obligatorio es registrar el numero de confirmacion del pago.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c5l1q8',
          question: 'Cuales son las secciones incluidas en la exportacion CSV de una factura?',
          options: [
            { id: 'a', text: 'Solo header y deliveries', explanation: 'El CSV no se limita a solo dos secciones. Incluye siete secciones: header, deliveries, adjustments, reversals, deductions, associated costs y vehicle services.' },
            { id: 'b', text: 'Header, deliveries, adjustments, reversals, deductions, associated costs y vehicle services' },
            { id: 'c', text: 'Resumen general y total', explanation: 'El CSV no es un simple resumen. Contiene siete secciones detalladas que cubren entregas, ajustes, reversiones, deducciones, costos asociados y servicios de vehiculo.' },
            { id: 'd', text: 'Solo las actividades de entrega y sus montos', explanation: 'La exportacion incluye mucho mas que solo entregas. Tambien contiene adjustments, reversals, deductions, associated costs y vehicle services.' }
          ],
          correctOptionId: 'b'
        }
      ]
    }
  },
  {
    title: 'Rate Plans',
    order: 2,
    content: `
      <h2>Rate Plans</h2>
      <p>
        Un <strong>Rate Plan</strong> (plan de tarifas) define <strong>como calcular el precio</strong>
        para una parte especifica involucrada en la operacion logistica. Es el componente central del
        sistema de facturacion, ya que determina cuanto se cobra o se paga por cada actividad.
      </p>

      <h3>Propiedades de un Rate Plan</h3>
      <p>Cada rate plan cuenta con las siguientes propiedades:</p>
      <table>
        <thead>
          <tr>
            <th>Propiedad</th>
            <th>Descripcion</th>
            <th>Requerido</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>name</strong></td>
            <td>Nombre identificativo del rate plan</td>
            <td>Si</td>
          </tr>
          <tr>
            <td><strong>description</strong></td>
            <td>Descripcion detallada del proposito del plan</td>
            <td>No</td>
          </tr>
          <tr>
            <td><strong>type</strong></td>
            <td>Tipo de rate plan (Shipper, Vendor, Driver, Service Provider)</td>
            <td>Si</td>
          </tr>
          <tr>
            <td><strong>validity dates</strong></td>
            <td>Fechas de inicio y fin de vigencia (el fin es opcional)</td>
            <td>Inicio si, fin no</td>
          </tr>
          <tr>
            <td><strong>associated org/drivers</strong></td>
            <td>Organizacion o drivers a los que aplica este plan</td>
            <td>Si</td>
          </tr>
          <tr>
            <td><strong>blocks</strong></td>
            <td>Bloques de pricing que contienen la logica de calculo</td>
            <td>Si (al menos uno)</td>
          </tr>
        </tbody>
      </table>

      <h3>Tipos de Rate Plans</h3>
      <p>
        El sistema soporta cuatro tipos de rate plans, cada uno disenado para una parte diferente
        de la operacion logistica:
      </p>

      <h3>1. Shipper (Cobro al Cliente)</h3>
      <p>
        Define cuanto se <strong>cobra al cliente</strong> (shipper) que envia los paquetes.
        Es el rate plan que genera ingresos para la operacion.
      </p>
      <div class="callout">
        <strong>Ejemplo:</strong> "Plan estandar para ACME Corp - $5 base + cargo por peso".
        Cada vez que se entrega un paquete de ACME Corp, el sistema calcula el cargo segun
        este rate plan y genera una actividad facturable de tipo cobro.
      </div>

      <h3>2. Vendor (Pago al Operador)</h3>
      <p>
        Define cuanto se <strong>paga al operador de ultima milla</strong> (vendor) que realiza
        las entregas. Este tipo representa un costo operativo.
      </p>
      <div class="callout">
        <strong>Ejemplo:</strong> "Pago a Delivery Co - $4.50 por entrega". Cada entrega
        completada por este vendor genera una actividad facturable que se incluira en la
        factura de pago al vendor.
      </div>

      <h3>3. Driver (Pago al Conductor)</h3>
      <p>
        Define cuanto se <strong>paga al driver individual</strong> que realiza la entrega.
        Permite configurar tarifas diferenciadas por zona, tipo de entrega u otros criterios.
      </p>
      <div class="callout">
        <strong>Ejemplo:</strong> "Pago por entrega zona norte - $3.00 + combustible".
        Cada entrega del driver en la zona norte genera un pago calculado con este plan.
      </div>

      <h3>4. Service Provider (Pago a Proveedor Externo)</h3>
      <p>
        Define cuanto se <strong>paga a proveedores de servicios externos</strong> que
        participan en la operacion logistica sin ser parte directa de la cadena de entrega.
      </p>
      <div class="callout">
        <strong>Ejemplo:</strong> "Tarifa de cross-docking". Cuando se utiliza un servicio
        de cross-docking externo, el sistema calcula el costo segun este rate plan.
      </div>

      <h3>Vigencia de Rate Plans</h3>
      <p>
        Los rate plans tienen fechas de vigencia que determinan cuando estan activos. La fecha
        de inicio es obligatoria, pero la fecha de fin es opcional. Si no se especifica fecha
        de fin, el rate plan permanece activo indefinidamente.
      </p>
      <p>
        Cuando el sistema busca el rate plan aplicable para una actividad, selecciona aquel
        cuyo rango de vigencia incluye la fecha de la actividad. Si existen multiples rate
        plans vigentes para la misma parte, se utiliza el mas especifico o reciente.
      </p>

      <div class="callout warning">
        <strong>Importante:</strong> Cada rate plan debe tener al menos un bloque de pricing
        configurado. Los bloques son los que contienen la logica real de calculo de precios,
        y se ejecutan en secuencia para determinar el precio final.
      </div>

      <h3>Relacion entre Rate Plans y Facturacion</h3>
      <p>
        Cuando ocurre un evento facturable (por ejemplo, una entrega), el sistema busca todos
        los rate plans activos aplicables a las partes involucradas. Para cada parte (shipper,
        vendor, driver), se ejecuta su rate plan correspondiente y se genera una actividad
        facturable con el precio calculado. Estas actividades se acumulan y luego se agrupan
        en facturas.
      </p>
    `,
    test: {
      questions: [
        {
          id: 'c5l2q1',
          question: 'Que define un Rate Plan en el sistema de facturacion?',
          options: [
            { id: 'a', text: 'El formato de la factura impresa', explanation: 'Un Rate Plan no define formatos de impresion. Su funcion es definir como calcular el precio para una parte especifica de la operacion.' },
            { id: 'b', text: 'Como calcular el precio para una parte especifica de la operacion' },
            { id: 'c', text: 'La fecha de vencimiento de un pago', explanation: 'Las fechas de vencimiento no son parte de un Rate Plan. Este define la logica de calculo de precios, no plazos de pago.' },
            { id: 'd', text: 'El metodo de pago preferido del cliente', explanation: 'Los metodos de pago no se configuran en un Rate Plan. Su proposito es definir como se calcula el precio para cada parte de la operacion.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c5l2q2',
          question: 'Que tipo de rate plan se utiliza para cobrar al cliente que envia paquetes?',
          options: [
            { id: 'a', text: 'Vendor', explanation: 'Vendor define cuanto se paga al operador de ultima milla, no cuanto se cobra al cliente. El tipo correcto para cobrar al cliente es Shipper.' },
            { id: 'b', text: 'Driver', explanation: 'Driver define cuanto se paga al conductor individual, no cuanto se cobra al cliente que envia paquetes.' },
            { id: 'c', text: 'Shipper' },
            { id: 'd', text: 'Service Provider', explanation: 'Service Provider define pagos a proveedores de servicios externos como cross-docking, no cobros al cliente que envia paquetes.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c5l2q3',
          question: 'Cual es la diferencia entre un rate plan Vendor y uno Driver?',
          options: [
            { id: 'a', text: 'No hay diferencia, son sinonimos', explanation: 'Si hay diferencia: Vendor paga a la empresa operadora de ultima milla, mientras que Driver paga al conductor individual. Son niveles distintos.' },
            { id: 'b', text: 'Vendor paga al operador de ultima milla, Driver paga al conductor individual' },
            { id: 'c', text: 'Vendor es para cobros y Driver es para pagos', explanation: 'Ambos tipos son para pagos, no se diferencian por cobro vs pago. La diferencia es a quien se paga: empresa operadora vs conductor individual.' },
            { id: 'd', text: 'Vendor aplica solo a transporte middle-mile', explanation: 'Vendor no se limita a middle-mile. Se usa para pagar al operador de ultima milla que realiza las entregas.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c5l2q4',
          question: 'La fecha de fin de vigencia de un rate plan es obligatoria?',
          options: [
            { id: 'a', text: 'Si, siempre es obligatoria', explanation: 'La fecha de fin no es obligatoria. Es opcional, y si no se especifica, el rate plan permanece activo indefinidamente.' },
            { id: 'b', text: 'No, es opcional. Si no se especifica, el plan permanece activo indefinidamente' },
            { id: 'c', text: 'Solo es obligatoria para rate plans de tipo Shipper', explanation: 'La fecha de fin es opcional para todos los tipos de rate plan, no solo para Shipper. No hay distincion por tipo en este requisito.' },
            { id: 'd', text: 'No existe fecha de fin, solo fecha de inicio', explanation: 'Si existe la fecha de fin como campo, pero es opcional. Puede configurarse cuando se desea que el rate plan expire en una fecha determinada.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c5l2q5',
          question: 'Que son los "blocks" dentro de un rate plan?',
          options: [
            { id: 'a', text: 'Secciones del reporte CSV', explanation: 'Los blocks no son secciones de reportes. Son bloques de pricing que contienen la logica de calculo de precios dentro de un rate plan.' },
            { id: 'b', text: 'Periodos de tiempo de facturacion', explanation: 'Los blocks no representan periodos de tiempo. Son componentes de calculo que definen la logica de pricing dentro del rate plan.' },
            { id: 'c', text: 'Bloques de pricing que contienen la logica de calculo de precios' },
            { id: 'd', text: 'Grupos de facturas relacionadas', explanation: 'Los blocks no agrupan facturas. Son unidades de calculo dentro de un rate plan que determinan como se calcula el precio.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c5l2q6',
          question: 'Para que tipo de rate plan se usa el ejemplo "Tarifa de cross-docking"?',
          options: [
            { id: 'a', text: 'Shipper', explanation: 'Shipper es para cobrar al cliente que envia paquetes. El cross-docking es un servicio externo que corresponde a Service Provider.' },
            { id: 'b', text: 'Vendor', explanation: 'Vendor es para pagar al operador de ultima milla. El cross-docking es un servicio externo, no una operacion de entrega directa.' },
            { id: 'c', text: 'Driver', explanation: 'Driver es para pagar al conductor individual. El cross-docking es un servicio externo que no involucra conductores directamente.' },
            { id: 'd', text: 'Service Provider' }
          ],
          correctOptionId: 'd'
        },
        {
          id: 'c5l2q7',
          question: 'Cuantos bloques de pricing debe tener como minimo un rate plan?',
          options: [
            { id: 'a', text: 'Ninguno, los bloques son opcionales', explanation: 'Los bloques no son opcionales. Todo rate plan debe tener al menos un bloque de pricing configurado para funcionar.' },
            { id: 'b', text: 'Al menos uno' },
            { id: 'c', text: 'Exactamente tres', explanation: 'No se requiere un numero exacto de tres bloques. El requisito minimo es tener al menos uno, pero se pueden tener mas segun la complejidad del calculo.' },
            { id: 'd', text: 'Depende del tipo de rate plan', explanation: 'El requisito de al menos un bloque aplica a todos los tipos de rate plan por igual, sin importar si es Shipper, Vendor, Driver o Service Provider.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c5l2q8',
          question: 'Que sucede cuando ocurre un evento facturable como una entrega?',
          options: [
            { id: 'a', text: 'Se genera automaticamente una factura completa', explanation: 'No se genera una factura completa de inmediato. Se crean actividades facturables individuales que luego se agrupan en facturas mediante un cron job o accion manual.' },
            { id: 'b', text: 'Se buscan los rate plans activos para cada parte y se generan actividades facturables con el precio calculado' },
            { id: 'c', text: 'Se notifica al administrador para calculo manual', explanation: 'El calculo es automatico basado en los rate plans activos, no requiere intervencion manual del administrador para cada evento.' },
            { id: 'd', text: 'Se aplica un precio fijo predeterminado', explanation: 'No se aplica un precio fijo. El precio se calcula dinamicamente ejecutando los bloques de pricing del rate plan correspondiente a cada parte.' }
          ],
          correctOptionId: 'b'
        }
      ]
    }
  },
  {
    title: 'Bloques de Pricing',
    order: 3,
    content: `
      <h2>Bloques de Pricing</h2>
      <p>
        Los bloques son la <strong>unidad fundamental de calculo de precios</strong> en el sistema de
        facturacion. Un rate plan contiene uno o mas bloques que se ejecutan en secuencia. Cada bloque
        puede tener un bloque hijo (nesting), lo que permite construir logicas de calculo complejas
        y encadenadas.
      </p>

      <h3>Tipos de Bloques</h3>
      <p>El sistema ofrece cinco tipos de bloques, cada uno disenado para un patron de calculo diferente:</p>

      <table>
        <thead>
          <tr>
            <th>Tipo de Bloque</th>
            <th>Descripcion</th>
            <th>Atributos Aplicables</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Flat</strong></td>
            <td>Precio fijo que siempre se aplica, sin condiciones. Es el bloque mas simple.</td>
            <td>Ninguno (se aplica siempre)</td>
          </tr>
          <tr>
            <td><strong>Range</strong></td>
            <td>Precio basado en rangos numericos. El valor del atributo del envio determina en que rango cae y que precio aplica.</td>
            <td><code>weight</code>, <code>maxWeight</code>, <code>dimWeight</code></td>
          </tr>
          <tr>
            <td><strong>Discrete</strong></td>
            <td>Precio especifico por cada valor exacto del atributo. Funciona como un mapeo directo de valor a precio.</td>
            <td><code>routeCode</code>, <code>vendor</code>, <code>shipper</code>, <code>serviceCategory</code></td>
          </tr>
          <tr>
            <td><strong>Boolean</strong></td>
            <td>Cargo condicional que se aplica solo si la condicion es verdadera.</td>
            <td><code>signature</code>, <code>lateDelivery</code>, <code>late_dispatch</code></td>
          </tr>
          <tr>
            <td><strong>Fuel Surcharge</strong></td>
            <td>Recargo por combustible calculado automaticamente a partir del precio actual del diesel obtenido de la API de EIA (US Energy Information Administration).</td>
            <td>Ninguno (se calcula automaticamente)</td>
          </tr>
        </tbody>
      </table>

      <h3>Detalle de Cada Tipo de Bloque</h3>

      <h3>Bloque Flat</h3>
      <p>
        El bloque <strong>Flat</strong> aplica un precio fijo sin evaluar ningun atributo del envio.
        Se usa tipicamente como cargo base o tarifa plana que siempre se incluye en el calculo.
      </p>
      <div class="callout">
        <strong>Ejemplo:</strong> Un cargo base de $5.00 por cada entrega. Sin importar el peso,
        la zona o cualquier otra caracteristica del envio, este monto siempre se aplica.
      </div>

      <h3>Bloque Range</h3>
      <p>
        El bloque <strong>Range</strong> define rangos numericos y asigna un precio a cada rango.
        El sistema evalua el valor del atributo seleccionado (peso, peso dimensional, etc.) y
        determina en que rango cae para aplicar el precio correspondiente.
      </p>
      <div class="callout">
        <strong>Ejemplo:</strong> Cargo por peso:<br/>
        0-5 lbs: $0.00 | 5-20 lbs: $1.50 | 20-50 lbs: $3.00 | 50-100 lbs: $5.00
      </div>

      <h3>Bloque Discrete</h3>
      <p>
        El bloque <strong>Discrete</strong> asigna un precio especifico para cada valor exacto
        de un atributo. A diferencia de Range que trabaja con intervalos numericos, Discrete
        trabaja con valores puntuales (generalmente textuales).
      </p>
      <div class="callout">
        <strong>Ejemplo:</strong> Precio por codigo de ruta:<br/>
        NJ-NORTH: $4.50 | NJ-SOUTH: $5.00 | NY-METRO: $6.50
      </div>

      <h3>Bloque Boolean</h3>
      <p>
        El bloque <strong>Boolean</strong> aplica un cargo adicional solamente cuando una condicion
        especifica es verdadera. Si la condicion es falsa, el bloque no tiene efecto sobre el precio.
      </p>
      <div class="callout">
        <strong>Ejemplo:</strong> Cargo de $1.00 adicional si el envio requiere firma (signature = true).
        Si el envio no requiere firma, este bloque no afecta el precio.
      </div>

      <h3>Bloque Fuel Surcharge</h3>
      <p>
        El bloque <strong>Fuel Surcharge</strong> agrega un recargo porcentual basado en el precio
        actual del diesel. El precio del diesel se obtiene automaticamente de la API de la
        <strong>EIA</strong> (US Energy Information Administration) o puede ingresarse manualmente.
      </p>
      <div class="callout warning">
        <strong>Importante:</strong> El fuel surcharge se calcula como un porcentaje sobre el precio
        acumulado hasta ese punto en la cadena de bloques, no sobre un valor fijo.
      </div>

      <h3>Tipos de Pricing (Como se Aplica el Precio)</h3>
      <p>
        Cada bloque no solo define un monto, sino tambien <strong>como se aplica</strong> ese monto
        al precio acumulado. Existen tres tipos de pricing:
      </p>
      <table>
        <thead>
          <tr>
            <th>Tipo de Pricing</th>
            <th>Formula</th>
            <th>Descripcion</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Fixed</strong></td>
            <td><code>precio = monto_del_bloque</code></td>
            <td>Establece el precio al monto del bloque, ignorando cualquier precio previo. Reemplaza el precio acumulado.</td>
          </tr>
          <tr>
            <td><strong>Fixed Add</strong></td>
            <td><code>precio = precio_actual + monto_del_bloque</code></td>
            <td>Suma el monto del bloque al precio acumulado actual. Es una adicion fija sobre el precio existente.</td>
          </tr>
          <tr>
            <td><strong>Percentage</strong></td>
            <td><code>precio = precio_actual + (precio_actual x monto / 100)</code></td>
            <td>Agrega un porcentaje del precio acumulado. El monto del bloque representa el porcentaje a aplicar.</td>
          </tr>
        </tbody>
      </table>

      <h3>Anidamiento de Bloques (Nesting)</h3>
      <p>
        Los bloques pueden anidarse formando una cadena padre-hijo. Cada bloque puede tener un
        <strong>bloque hijo</strong> que se ejecuta despues del padre, usando el precio resultante
        del padre como punto de partida. Esta estructura permite construir logicas de calculo
        sofisticadas de forma modular.
      </p>
      <p>La ejecucion sigue este orden:</p>
      <ol>
        <li>Se ejecuta el bloque raiz y se obtiene un precio inicial.</li>
        <li>Se ejecuta el bloque hijo del raiz, tomando como base el precio del paso anterior.</li>
        <li>Se continua con el siguiente nivel de anidamiento, si existe.</li>
        <li>El precio final es el resultado del ultimo bloque ejecutado en la cadena.</li>
      </ol>

      <div class="callout">
        <strong>Concepto clave:</strong> La combinacion de tipos de bloque con tipos de pricing
        permite una flexibilidad enorme. Por ejemplo, un bloque Flat con pricing Fixed establece
        un precio base, seguido de un bloque Range con pricing Fixed Add que agrega un cargo
        variable, y finalmente un bloque Fuel Surcharge con pricing Percentage que aplica un
        recargo porcentual sobre el total acumulado.
      </div>
    `,
    test: {
      questions: [
        {
          id: 'c5l3q1',
          question: 'Que es un bloque de pricing en el contexto de un rate plan?',
          options: [
            { id: 'a', text: 'Un periodo de facturacion mensual', explanation: 'Un bloque de pricing no es un periodo temporal. Es la unidad de calculo que contiene la logica para determinar precios dentro de un rate plan.' },
            { id: 'b', text: 'La unidad fundamental de calculo de precios que contiene la logica de calculo' },
            { id: 'c', text: 'Un grupo de facturas relacionadas', explanation: 'Los bloques no agrupan facturas. Son componentes dentro de un rate plan que definen como se calcula el precio de una actividad.' },
            { id: 'd', text: 'Una seccion del reporte de facturacion', explanation: 'Los bloques no son secciones de reportes. Son unidades de calculo que se ejecutan en secuencia para determinar el precio final.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c5l3q2',
          question: 'Que tipo de bloque aplica un precio fijo sin evaluar ningun atributo del envio?',
          options: [
            { id: 'a', text: 'Range', explanation: 'Range evalua rangos numericos de atributos como peso o peso dimensional. No aplica un precio fijo incondicional.' },
            { id: 'b', text: 'Discrete', explanation: 'Discrete asigna precios segun valores exactos de atributos como routeCode o vendor. Si evalua atributos del envio.' },
            { id: 'c', text: 'Flat' },
            { id: 'd', text: 'Boolean', explanation: 'Boolean evalua condiciones verdadero/falso como signature o lateDelivery. Solo aplica el cargo si la condicion es verdadera.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c5l3q3',
          question: 'Cual es la diferencia entre los tipos de pricing Fixed y Fixed Add?',
          options: [
            { id: 'a', text: 'No hay diferencia, son el mismo tipo', explanation: 'Si hay diferencia: Fixed reemplaza el precio acumulado por el monto del bloque, mientras que Fixed Add suma el monto al precio existente.' },
            { id: 'b', text: 'Fixed reemplaza el precio acumulado, Fixed Add suma al precio acumulado' },
            { id: 'c', text: 'Fixed es para cobros y Fixed Add es para pagos', explanation: 'La diferencia no es cobro vs pago. Fixed reemplaza el precio acumulado y Fixed Add suma al precio acumulado, independientemente del tipo de operacion.' },
            { id: 'd', text: 'Fixed Add se aplica solo a bloques Flat', explanation: 'Fixed Add puede aplicarse a cualquier tipo de bloque, no solo a Flat. Es un tipo de pricing independiente del tipo de bloque.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c5l3q4',
          question: 'Que atributos se pueden usar con un bloque de tipo Range?',
          options: [
            { id: 'a', text: 'routeCode, vendor, shipper', explanation: 'Estos atributos son para bloques Discrete, que asignan precios por valores exactos. Los bloques Range usan atributos numericos como weight, maxWeight y dimWeight.' },
            { id: 'b', text: 'signature, lateDelivery, late_dispatch', explanation: 'Estos atributos son para bloques Boolean, que evaluan condiciones verdadero/falso. Los bloques Range usan atributos numericos.' },
            { id: 'c', text: 'weight, maxWeight, dimWeight' },
            { id: 'd', text: 'No usa atributos', explanation: 'Los bloques Range si usan atributos. Evaluan atributos numericos como weight, maxWeight y dimWeight para determinar en que rango cae el valor.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c5l3q5',
          question: 'Como funciona el tipo de pricing Percentage?',
          options: [
            { id: 'a', text: 'Reemplaza el precio por el porcentaje del monto base', explanation: 'Percentage no reemplaza el precio. Suma al precio actual un porcentaje calculado sobre el precio acumulado (precio + precio x monto/100).' },
            { id: 'b', text: 'Suma al precio actual un porcentaje calculado sobre el precio acumulado' },
            { id: 'c', text: 'Calcula un porcentaje fijo sobre el peso del paquete', explanation: 'Percentage no se basa en el peso del paquete. Se calcula sobre el precio acumulado hasta ese punto en la cadena de bloques.' },
            { id: 'd', text: 'Aplica un descuento porcentual sobre el total', explanation: 'Percentage no es un descuento. Es un recargo que suma un porcentaje del precio acumulado al total.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c5l3q6',
          question: 'De donde obtiene el sistema el precio del diesel para el bloque Fuel Surcharge?',
          options: [
            { id: 'a', text: 'Se configura manualmente una sola vez', explanation: 'No es una configuracion unica. El precio se actualiza periodicamente desde la API de EIA o mediante ingreso manual, con fechas de vigencia.' },
            { id: 'b', text: 'De la API de EIA (US Energy Information Administration) o ingreso manual' },
            { id: 'c', text: 'Del precio promedio de gasolineras locales', explanation: 'El sistema no consulta precios de gasolineras locales. Usa la API oficial de la EIA (US Energy Information Administration) o ingreso manual.' },
            { id: 'd', text: 'Se calcula basado en el kilometraje de la ruta', explanation: 'El fuel surcharge no se basa en kilometraje. Se calcula usando el precio actual del diesel obtenido de la API de EIA o ingresado manualmente.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c5l3q7',
          question: 'Que sucede cuando un bloque Boolean evalua una condicion falsa?',
          options: [
            { id: 'a', text: 'Aplica el precio con un descuento del 50%', explanation: 'No se aplica ningun descuento cuando la condicion es falsa. El bloque simplemente no tiene efecto sobre el precio.' },
            { id: 'b', text: 'Genera un error en el calculo', explanation: 'Una condicion falsa no genera errores. El bloque Boolean simplemente se omite y el precio continua sin cambios.' },
            { id: 'c', text: 'No tiene efecto sobre el precio' },
            { id: 'd', text: 'Aplica el precio en negativo (descuento)', explanation: 'No se aplica ningun valor negativo ni descuento. Cuando la condicion es falsa, el bloque Boolean no modifica el precio de ninguna forma.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c5l3q8',
          question: 'Como funciona el anidamiento (nesting) de bloques?',
          options: [
            { id: 'a', text: 'Cada bloque se ejecuta de forma independiente y los precios se suman al final', explanation: 'Los bloques anidados no se ejecutan de forma independiente. Cada hijo toma como base el precio resultante del padre, formando una cadena secuencial.' },
            { id: 'b', text: 'Solo se puede tener un nivel de anidamiento', explanation: 'No hay limite de un solo nivel. Los bloques pueden anidarse en multiples niveles, continuando la cadena hasta el ultimo bloque.' },
            { id: 'c', text: 'Cada bloque hijo toma como base el precio resultante del bloque padre y se ejecutan en cadena' },
            { id: 'd', text: 'Los bloques anidados solo aplican en rate plans de tipo Shipper', explanation: 'El anidamiento de bloques esta disponible para todos los tipos de rate plan, no solo para Shipper.' }
          ],
          correctOptionId: 'c'
        }
      ]
    }
  },
  {
    title: 'Calculos y Peso Dimensional',
    order: 4,
    content: `
      <h2>Calculos y Peso Dimensional</h2>
      <p>
        En esta leccion veremos ejemplos concretos de como se ejecutan los bloques de pricing
        en cadena para calcular el precio final de una actividad. Tambien cubriremos el concepto
        de <strong>peso dimensional</strong> (dimWeight), un calculo fundamental en la logistica
        de paqueteria.
      </p>

      <h3>Ejemplo 1: Rate Plan Shipper con Cargo Base, Peso y Fuel Surcharge</h3>
      <p>
        Supongamos un rate plan de tipo Shipper con la siguiente configuracion:
        "Cobrar $5.00 base, agregar cargo por peso, aplicar 8% de fuel surcharge."
      </p>

      <p><strong>Estructura de bloques:</strong></p>
      <table>
        <thead>
          <tr>
            <th>Nivel</th>
            <th>Bloque</th>
            <th>Tipo</th>
            <th>Configuracion</th>
            <th>Pricing</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1 (raiz)</td>
            <td>Bloque 1</td>
            <td>Flat</td>
            <td>$5.00</td>
            <td>Fixed</td>
          </tr>
          <tr>
            <td>2 (hijo de 1)</td>
            <td>Bloque 2</td>
            <td>Range (weight)</td>
            <td>0-5 lbs: $0.00 | 5-20: $1.50 | 20-50: $3.00 | 50-100: $5.00</td>
            <td>Fixed Add</td>
          </tr>
          <tr>
            <td>3 (hijo de 2)</td>
            <td>Bloque 3</td>
            <td>Fuel Surcharge</td>
            <td>8%</td>
            <td>Percentage</td>
          </tr>
        </tbody>
      </table>

      <p><strong>Calculo para un paquete de 25 lbs:</strong></p>
      <table>
        <thead>
          <tr>
            <th>Paso</th>
            <th>Bloque</th>
            <th>Evaluacion</th>
            <th>Calculo</th>
            <th>Precio Acumulado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Flat $5.00 (Fixed)</td>
            <td>Siempre aplica</td>
            <td>precio = $5.00</td>
            <td><strong>$5.00</strong></td>
          </tr>
          <tr>
            <td>2</td>
            <td>Range weight (Fixed Add)</td>
            <td>25 lbs cae en rango 20-50: $3.00</td>
            <td>precio = $5.00 + $3.00</td>
            <td><strong>$8.00</strong></td>
          </tr>
          <tr>
            <td>3</td>
            <td>Fuel Surcharge 8% (Percentage)</td>
            <td>8% sobre precio acumulado</td>
            <td>precio = $8.00 + ($8.00 x 8 / 100) = $8.00 + $0.64</td>
            <td><strong>$8.64</strong></td>
          </tr>
        </tbody>
      </table>

      <div class="callout">
        <strong>Resultado:</strong> El precio final para un paquete de 25 lbs es <strong>$8.64</strong>.
        Se compone de $5.00 base + $3.00 por rango de peso + $0.64 de fuel surcharge (8% sobre $8.00).
      </div>

      <h3>Ejemplo 2: Rate Plan Vendor por Zona con Cargo por Firma</h3>
      <p>
        Ahora veamos un rate plan de tipo Vendor con la configuracion: "Pagar segun zona de entrega,
        agregar $1.00 si requiere firma."
      </p>

      <p><strong>Estructura de bloques:</strong></p>
      <table>
        <thead>
          <tr>
            <th>Nivel</th>
            <th>Bloque</th>
            <th>Tipo</th>
            <th>Configuracion</th>
            <th>Pricing</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1 (raiz)</td>
            <td>Bloque 1</td>
            <td>Discrete (routeCode)</td>
            <td>NJ-NORTH: $4.50 | NJ-SOUTH: $5.00 | NY-METRO: $6.50</td>
            <td>Fixed</td>
          </tr>
          <tr>
            <td>2 (hijo de 1)</td>
            <td>Bloque 2</td>
            <td>Boolean (signature)</td>
            <td>$1.00</td>
            <td>Fixed Add</td>
          </tr>
        </tbody>
      </table>

      <p><strong>Calculo para entrega en NJ-SOUTH con firma:</strong></p>
      <table>
        <thead>
          <tr>
            <th>Paso</th>
            <th>Bloque</th>
            <th>Evaluacion</th>
            <th>Calculo</th>
            <th>Precio Acumulado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Discrete routeCode (Fixed)</td>
            <td>routeCode = NJ-SOUTH: $5.00</td>
            <td>precio = $5.00</td>
            <td><strong>$5.00</strong></td>
          </tr>
          <tr>
            <td>2</td>
            <td>Boolean signature (Fixed Add)</td>
            <td>signature = true: $1.00</td>
            <td>precio = $5.00 + $1.00</td>
            <td><strong>$6.00</strong></td>
          </tr>
        </tbody>
      </table>

      <div class="callout">
        <strong>Resultado:</strong> El pago al vendor por una entrega en NJ-SOUTH con firma requerida
        es <strong>$6.00</strong>. Si la entrega no requiriera firma, el bloque Boolean no tendria efecto
        y el precio final seria $5.00.
      </div>

      <h3>Peso Dimensional (Dimensional Weight)</h3>
      <p>
        El peso dimensional es un concepto clave en logistica de paqueteria. Refleja la cantidad
        de espacio que ocupa un paquete en relacion a su peso real. Un paquete grande pero liviano
        ocupa espacio valioso en un vehiculo, por lo que se cobra segun el mayor entre el peso
        real y el peso dimensional.
      </p>

      <h3>Formula del Peso Dimensional</h3>
      <pre>dimWeight = (length x width x height) / dimFactor</pre>

      <p>El <strong>dimFactor</strong> (factor dimensional) varia segun la unidad de medida:</p>
      <table>
        <thead>
          <tr>
            <th>Unidad de Medida</th>
            <th>dimFactor Tipico</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Pulgadas (inches)</td>
            <td>300</td>
          </tr>
          <tr>
            <td>Centimetros (cm)</td>
            <td>5000</td>
          </tr>
        </tbody>
      </table>

      <div class="callout warning">
        <strong>Importante:</strong> El dimFactor es configurable por organizacion. Los valores 300
        y 5000 son los tipicos de la industria, pero cada organizacion puede definir su propio factor.
      </div>

      <h3>maxWeight: La Regla del Mayor Peso</h3>
      <p>Una vez calculado el peso dimensional, se aplica la regla del mayor peso:</p>
      <pre>maxWeight = max(peso_real, dimWeight)</pre>
      <p>
        El <strong>maxWeight</strong> es el valor que se utiliza en los bloques de tipo Range que
        evaluan peso. Esto asegura que se cobre por el mayor de los dos valores: el peso real
        del paquete o su peso dimensional.
      </p>

      <h3>Ejemplo de Calculo de Peso Dimensional</h3>
      <p>Supongamos un paquete con las siguientes caracteristicas:</p>
      <ul>
        <li>Dimensiones: 24" x 18" x 12" (pulgadas)</li>
        <li>Peso real: 15 lbs</li>
        <li>dimFactor: 300</li>
      </ul>
      <p><strong>Calculo:</strong></p>
      <pre>dimWeight = (24 x 18 x 12) / 300 = 5184 / 300 = 17.28 lbs
maxWeight = max(15, 17.28) = 17.28 lbs</pre>
      <p>
        En este caso, aunque el paquete pesa solo 15 lbs, su peso dimensional es 17.28 lbs.
        Como el peso dimensional es mayor, el sistema usara 17.28 lbs para calcular el cargo
        por peso. Usando el rate plan del Ejemplo 1, este paquete caeria en el rango 5-20 lbs
        ($1.50 de cargo adicional) en lugar de usar el peso real de 15 lbs directamente.
      </p>

      <div class="callout">
        <strong>Concepto clave:</strong> El peso dimensional protege a la operacion logistica contra
        paquetes voluminosos pero livianos que ocupan espacio desproporcionado en los vehiculos de
        entrega. El cobro por maxWeight garantiza que se facture de manera justa tanto por peso como
        por volumen.
      </div>
    `,
    test: {
      questions: [
        {
          id: 'c5l4q1',
          question: 'Un rate plan Shipper tiene: Bloque 1 Flat $5.00 (Fixed), Bloque 2 Range weight 0-5:$0 / 5-20:$1.50 / 20-50:$3.00 / 50-100:$5.00 (Fixed Add), Bloque 3 Fuel Surcharge 8% (Percentage). Cual es el precio final para un paquete de 25 lbs?',
          options: [
            { id: 'a', text: '$5.00', explanation: '$5.00 es solo el precio base del bloque Flat. Falta sumar el cargo por peso ($3.00) y el fuel surcharge ($0.64) para obtener el total de $8.64.' },
            { id: 'b', text: '$8.00', explanation: '$8.00 es el precio acumulado despues del cargo por peso, pero falta aplicar el fuel surcharge de 8% ($0.64) que lleva el total a $8.64.' },
            { id: 'c', text: '$8.64' },
            { id: 'd', text: '$10.00', explanation: '$10.00 no corresponde a ningun paso del calculo. El precio correcto es $8.64: $5.00 base + $3.00 por peso + $0.64 de fuel surcharge.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c5l4q2',
          question: 'En un rate plan con Bloque 1 Flat $5.00 (Fixed), Bloque 2 Range weight (Fixed Add) y Bloque 3 Fuel Surcharge 8% (Percentage), como se calcula el fuel surcharge si el precio acumulado tras los primeros dos bloques es $8.00?',
          options: [
            { id: 'a', text: '8% sobre los $5.00 base', explanation: 'El fuel surcharge no se calcula solo sobre el cargo base. Se aplica sobre el precio acumulado completo ($8.00), que incluye base mas cargo por peso.' },
            { id: 'b', text: '8% sobre los $3.00 del cargo por peso', explanation: 'El porcentaje no se aplica solo sobre el cargo por peso. Se calcula sobre el precio acumulado total de $8.00 hasta ese punto.' },
            { id: 'c', text: '8% sobre el precio acumulado de $8.00' },
            { id: 'd', text: 'Un monto fijo de $0.64', explanation: 'Los $0.64 no son un monto fijo sino el resultado de calcular 8% sobre $8.00. Si el precio acumulado fuera diferente, el fuel surcharge tambien cambiaria.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c5l4q3',
          question: 'Un rate plan Vendor tiene: Bloque 1 Discrete por routeCode (NJ-NORTH:$4.50 / NJ-SOUTH:$5.00 / NY-METRO:$6.50, Fixed) y Bloque 2 Boolean signature $1.00 (Fixed Add). Que precio tendria una entrega en NJ-SOUTH sin firma?',
          options: [
            { id: 'a', text: '$4.50', explanation: '$4.50 es el precio de la zona NJ-NORTH, no NJ-SOUTH. El precio de NJ-SOUTH segun el bloque Discrete es $5.00.' },
            { id: 'b', text: '$5.00' },
            { id: 'c', text: '$6.00', explanation: '$6.00 seria el precio con firma ($5.00 + $1.00). Sin firma, el bloque Boolean no tiene efecto y el precio es solo $5.00.' },
            { id: 'd', text: '$6.50', explanation: '$6.50 es el precio de la zona NY-METRO, no NJ-SOUTH. El precio de NJ-SOUTH sin firma es $5.00.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c5l4q4',
          question: 'Cual es la formula del peso dimensional?',
          options: [
            { id: 'a', text: 'dimWeight = (length + width + height) / dimFactor', explanation: 'Las dimensiones deben multiplicarse entre si, no sumarse. Sumarlas no representaria el volumen del paquete.' },
            { id: 'b', text: 'dimWeight = (length x width x height) / dimFactor' },
            { id: 'c', text: 'dimWeight = (length x width x height) x dimFactor', explanation: 'El volumen se divide por el dimFactor, no se multiplica. Multiplicar daria un resultado enormemente mayor al correcto.' },
            { id: 'd', text: 'dimWeight = peso_real x dimFactor', explanation: 'El peso dimensional no se calcula a partir del peso real. Se basa en las dimensiones fisicas del paquete divididas por el dimFactor.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c5l4q5',
          question: 'Cual es el dimFactor tipico para dimensiones en pulgadas?',
          options: [
            { id: 'a', text: '139', explanation: '139 no es el dimFactor usado en este sistema. El valor configurado para pulgadas es 300.' },
            { id: 'b', text: '300' },
            { id: 'c', text: '5000', explanation: '5000 es el dimFactor tipico para centimetros, no para pulgadas. Para dimensiones en pulgadas el valor es 300.' },
            { id: 'd', text: '1000', explanation: '1000 no es un dimFactor estandar. El valor para pulgadas es 300 y para centimetros es 5000.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c5l4q6',
          question: 'Que es maxWeight y como se determina?',
          options: [
            { id: 'a', text: 'Es el peso maximo permitido por el vehiculo', explanation: 'maxWeight no se refiere a limites del vehiculo. Es el mayor entre el peso real y el peso dimensional del paquete individual.' },
            { id: 'b', text: 'Es el mayor entre el peso real y el peso dimensional del paquete' },
            { id: 'c', text: 'Es el peso del paquete mas el peso del embalaje', explanation: 'maxWeight no incluye el peso del embalaje. Se calcula como max(peso_real, dimWeight), comparando peso real contra peso dimensional.' },
            { id: 'd', text: 'Es el limite de peso de la categoria de envio', explanation: 'maxWeight no es un limite de categoria. Es un valor calculado como el mayor entre el peso real y el peso dimensional de cada paquete.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c5l4q7',
          question: 'Un paquete de 24x18x12 pulgadas con peso real de 15 lbs (dimFactor 300), en que rango de peso caeria usando maxWeight?',
          options: [
            { id: 'a', text: '5-20 lbs '},
            { id: 'b', text: '20-50 lbs', explanation: 'El dimWeight es 17.28 lbs (5184/300), que no alcanza el rango 20-50. El maxWeight es 17.28 lbs, que cae en el rango 5-20 lbs.' },
            { id: 'c', text: '0-5 lbs', explanation: 'Ni el peso real (15 lbs) ni el dimensional (17.28 lbs) caen en el rango 0-5 lbs. El maxWeight es 17.28 lbs, que corresponde al rango 5-20.' },
            { id: 'd', text: '50-100 lbs', explanation: 'El dimWeight calculado es 17.28 lbs (24x18x12/300), muy lejos del rango 50-100 lbs. Cae en el rango 5-20 lbs.' }
          ],
          correctOptionId: 'a'
        },
        {
          id: 'c5l4q8',
          question: 'Por que se utiliza el concepto de peso dimensional en logistica?',
          options: [
            { id: 'a', text: 'Para reducir el peso total de los vehiculos', explanation: 'El peso dimensional no busca reducir peso. Su proposito es cobrar de manera justa por paquetes voluminosos que ocupan mucho espacio aunque sean livianos.' },
            { id: 'b', text: 'Para cobrar de manera justa por paquetes voluminosos que ocupan espacio desproporcionado' },
            { id: 'c', text: 'Para cumplir regulaciones gubernamentales de transporte', explanation: 'El peso dimensional no es un requisito regulatorio. Es una practica de la industria logistica para facturar justamente el espacio ocupado por paquetes voluminosos.' },
            { id: 'd', text: 'Para calcular el combustible necesario por ruta', explanation: 'El peso dimensional no se usa para calcular combustible. Se usa para determinar el cargo por paquetes que ocupan espacio desproporcionado en los vehiculos.' }
          ],
          correctOptionId: 'b'
        }
      ]
    }
  },
  {
    title: 'Actividades Facturables',
    order: 5,
    content: `
      <h2>Actividades Facturables</h2>
      <p>
        Las actividades facturables (billable activities) son los registros individuales que representan
        cada evento que genera un cargo o un pago dentro del sistema. Cada actividad tiene un precio
        calculado a traves de los bloques de pricing del rate plan correspondiente, e incluye un
        <strong>breakdown</strong> (desglose) detallado de como se llego al precio final.
      </p>

      <h3>Tipos de Actividades Facturables</h3>
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Cuando se Genera</th>
            <th>Efecto en Factura</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Delivered</strong></td>
            <td>Cuando un envio se marca como entregado</td>
            <td>Suma al total de entregas</td>
          </tr>
          <tr>
            <td><strong>RTS</strong> (Return to Sender)</td>
            <td>Cuando un envio es devuelto al remitente</td>
            <td>Suma (puede tener tarifa diferente a Delivered)</td>
          </tr>
          <tr>
            <td><strong>Reversal</strong></td>
            <td>Cuando una entrega se revierte (por ejemplo, reinbound de paquete ya entregado)</td>
            <td>Resta - cancela el cargo original</td>
          </tr>
          <tr>
            <td><strong>Adjustment</strong></td>
            <td>Ajuste manual creado por un administrador (credito o cargo adicional)</td>
            <td>Suma o resta segun el tipo de ajuste</td>
          </tr>
          <tr>
            <td><strong>Deduction</strong></td>
            <td>Deduccion aplicada (penalidad, descuento)</td>
            <td>Resta del total</td>
          </tr>
          <tr>
            <td><strong>Associated Cost</strong></td>
            <td>Costos configurados a nivel de nodo (warehouse), auto-generados en ciertos escaneos masivos como inbound</td>
            <td>Suma al total de costos asociados</td>
          </tr>
          <tr>
            <td><strong>Vehicle Service</strong></td>
            <td>Servicios de vehiculo realizados</td>
            <td>Suma al total de servicios de vehiculo</td>
          </tr>
        </tbody>
      </table>

      <h3>Breakdown de Precio</h3>
      <p>
        Cada actividad facturable incluye un <strong>breakdown</strong> (desglose) que muestra paso a paso
        como se calculo el precio final. Este desglose es esencial para la transparencia y auditoria del
        proceso de facturacion.
      </p>
      <div class="callout">
        <strong>Ejemplo de breakdown:</strong> Para una entrega con precio final de $8.64, el breakdown
        mostraria: Flat $5.00 (Fixed) -> Range weight 20-50 $3.00 (Fixed Add) -> Fuel Surcharge 8% $0.64
        (Percentage). Cada paso indica el bloque ejecutado, el monto y el tipo de pricing aplicado.
      </div>

      <h3>Totales de una Factura</h3>
      <p>
        Una factura agrupa multiples actividades facturables y calcula varios totales. Cada tipo de
        actividad contribuye a un total especifico:
      </p>
      <table>
        <thead>
          <tr>
            <th>Total</th>
            <th>Descripcion</th>
            <th>Tipo de Actividad</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Total deliveries</strong></td>
            <td>Suma de los precios de todas las actividades de tipo Delivered</td>
            <td>Delivered</td>
          </tr>
          <tr>
            <td><strong>Total deductions</strong></td>
            <td>Suma de las deducciones aplicadas (valor negativo)</td>
            <td>Deduction</td>
          </tr>
          <tr>
            <td><strong>Total reversals</strong></td>
            <td>Suma de las reversiones (valor negativo, cancela cargos originales)</td>
            <td>Reversal</td>
          </tr>
          <tr>
            <td><strong>Total adjustments</strong></td>
            <td>Suma de ajustes manuales (puede ser positivo o negativo)</td>
            <td>Adjustment</td>
          </tr>
          <tr>
            <td><strong>Total associated costs</strong></td>
            <td>Suma de costos operacionales asociados</td>
            <td>Associated Cost</td>
          </tr>
          <tr>
            <td><strong>Total vehicle services</strong></td>
            <td>Suma de servicios de vehiculo</td>
            <td>Vehicle Service</td>
          </tr>
        </tbody>
      </table>

      <p>Adicionalmente, se calculan dos metricas agregadas:</p>
      <ul>
        <li><strong>Average price per piece:</strong> <code>total deliveries / cantidad de entregas</code>. Representa el costo promedio por entrega.</li>
        <li><strong>Invoice total:</strong> La suma de todos los totales anteriores. Es el monto final de la factura.</li>
      </ul>

      <div class="callout warning">
        <strong>Importante:</strong> Los totales de deductions y reversals son valores negativos que se
        restan del total. El invoice total puede ser menor que el total de deliveries si hay muchas
        deducciones o reversiones.
      </div>

      <h3>Fuel Surcharge: Detalles del Calculo</h3>
      <p>
        El recargo por combustible se basa en el precio actual del diesel, que puede obtenerse de dos formas:
      </p>
      <ul>
        <li><strong>Automatica:</strong> Consulta semanal a la API de la <strong>EIA</strong> (US Energy Information Administration) para obtener el precio actual del diesel.</li>
        <li><strong>Manual:</strong> Un administrador puede ingresar el precio manualmente.</li>
      </ul>
      <p>
        Cada registro de precio de diesel tiene <strong>fechas de vigencia</strong> (inicio y fin),
        asegurando que el calculo use el precio correcto para el periodo de la actividad.
      </p>

      <p>Los rangos de fuel surcharge se configuran en una tabla como la siguiente:</p>
      <table>
        <thead>
          <tr>
            <th>Rango de Precio del Diesel</th>
            <th>Porcentaje de Surcharge</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>$2.00 - $2.50</td>
            <td>5%</td>
          </tr>
          <tr>
            <td>$2.50 - $3.00</td>
            <td>8%</td>
          </tr>
          <tr>
            <td>$3.00 - $3.50</td>
            <td>11%</td>
          </tr>
          <tr>
            <td>$3.50+</td>
            <td>15%</td>
          </tr>
        </tbody>
      </table>

      <h3>Costos Asociados (Associated Costs)</h3>
      <p>
        Los costos asociados son cargos operacionales configurados a nivel de <strong>nodo (warehouse)</strong>.
        Se generan automaticamente cuando ocurren ciertos escaneos masivos, como el proceso de inbound.
        Representan costos fijos de operacion del warehouse que se distribuyen entre las actividades facturables.
      </p>

      <h3>Flujo Completo de Facturacion</h3>
      <p>El proceso completo desde un evento hasta la factura sigue estos pasos:</p>
      <ol>
        <li><strong>Evento disparador:</strong> Ocurre un evento facturable (envio entregado, RTS, etc.).</li>
        <li><strong>Busqueda de rate plans:</strong> El sistema busca los rate plans activos para cada parte involucrada (shipper, vendor, driver).</li>
        <li><strong>Calculo de precio:</strong> Se ejecutan los bloques de pricing del rate plan con los datos del envio, generando el precio final y su breakdown.</li>
        <li><strong>Creacion de actividad:</strong> Se crea una actividad facturable con el precio calculado y el desglose completo.</li>
        <li><strong>Acumulacion:</strong> Las actividades se acumulan sin factura asignada (sin <code>invoiceId</code>).</li>
        <li><strong>Generacion de factura:</strong> Un cron job o accion manual agrupa las actividades pendientes y genera la factura.</li>
      </ol>

      <div class="callout">
        <strong>Concepto clave:</strong> Las actividades facturables son el puente entre los eventos
        operativos (entregas, devoluciones, etc.) y las facturas. Cada actividad tiene un precio
        calculado mediante rate plans y un desglose transparente del calculo. Las facturas simplemente
        agrupan estas actividades y calculan los totales correspondientes.
      </div>
    `,
    test: {
      questions: [
        {
          id: 'c5l5q1',
          question: 'Que tipo de actividad facturable se genera cuando un envio se marca como entregado?',
          options: [
            { id: 'a', text: 'RTS', explanation: 'RTS (Return to Sender) se genera cuando un envio es devuelto al remitente, no cuando se entrega exitosamente.' },
            { id: 'b', text: 'Delivered' },
            { id: 'c', text: 'Adjustment', explanation: 'Adjustment es un ajuste manual creado por un administrador, no una actividad generada automaticamente por una entrega.' },
            { id: 'd', text: 'Associated Cost', explanation: 'Associated Cost son costos operacionales de warehouse generados en escaneos masivos como inbound, no por entregas individuales.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c5l5q2',
          question: 'Que efecto tiene una actividad de tipo Reversal en la factura?',
          options: [
            { id: 'a', text: 'Suma al total de entregas', explanation: 'Una Reversal no suma sino que resta. Su proposito es cancelar el cargo original de una entrega que fue revertida.' },
            { id: 'b', text: 'Genera una nueva factura separada', explanation: 'Las reversiones no generan facturas separadas. Se incluyen como un valor negativo dentro de la misma factura, cancelando el cargo original.' },
            { id: 'c', text: 'Resta del total, cancelando el cargo original' },
            { id: 'd', text: 'No tiene efecto en el total', explanation: 'Las reversiones si tienen efecto: restan del total de la factura para cancelar el cargo de la entrega original que fue revertida.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c5l5q5',
          question: 'Que son los costos asociados (associated costs) y como se generan?',
          options: [
            { id: 'a', text: 'Son costos de combustible generados por cada ruta', explanation: 'Los costos asociados no son costos de combustible. Son costos operacionales de warehouse que se generan automaticamente en escaneos masivos como inbound.' },
            { id: 'b', text: 'Son costos operacionales de warehouse, auto-generados en escaneos masivos como inbound' },
            { id: 'c', text: 'Son costos de mantenimiento de vehiculos', explanation: 'Los costos asociados no tienen relacion con mantenimiento vehicular. Son cargos operacionales configurados a nivel de nodo (warehouse).' },
            { id: 'd', text: 'Son ajustes manuales creados por administradores', explanation: 'Los costos asociados se generan automaticamente, no son ajustes manuales. Los ajustes manuales corresponden al tipo de actividad Adjustment.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c5l5q8',
          question: 'Que es el breakdown de una actividad facturable?',
          options: [
            { id: 'a', text: 'El resumen ejecutivo de la factura', explanation: 'El breakdown no es un resumen ejecutivo de la factura. Es un desglose detallado paso a paso de como se calculo el precio de una actividad individual.' },
            { id: 'b', text: 'Un desglose paso a paso de como se calculo el precio final' },
            { id: 'c', text: 'La lista de bloques disponibles en el rate plan', explanation: 'El breakdown no lista los bloques disponibles sino los que realmente se ejecutaron, mostrando el monto y tipo de pricing aplicado en cada paso.' },
            { id: 'd', text: 'El historial de cambios de estado de la factura', explanation: 'El breakdown no tiene relacion con estados de factura. Es el desglose del calculo de precio de una actividad facturable, no un historial de transiciones.' }
          ],
          correctOptionId: 'b'
        }
      ]
    }
  }
];
