export const course8Data = {
  title: 'Vehiculos, Anomalias, Issues y Modulos Adicionales',
  description: 'Gestion de flota, inspecciones, anomalias automaticas, issues operativos, excepciones de servicio y modulos complementarios del sistema.',
  order: 8,
  published: true,
  totalLessons: 6
};

export const course8Lessons = [
  {
    title: 'Gestion de Vehiculos',
    order: 1,
    content: `
      <h2>Gestion de Vehiculos</h2>
      <p>
        El modulo de vehiculos permite gestionar la flota completa de una organizacion logistica.
        Cada vehiculo se registra con informacion detallada y se asocia a la organizacion propietaria,
        permitiendo un seguimiento integral de mantenimiento, documentos y costos.
      </p>

      <h3>Campos de Registro de un Vehiculo</h3>
      <p>Al dar de alta un vehiculo, se completan los siguientes campos:</p>
      <table>
        <thead>
          <tr>
            <th>Campo</th>
            <th>Descripcion</th>
            <th>Observaciones</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Placa (Plate)</strong></td>
            <td>Identificador unico principal del vehiculo</td>
            <td>Unica por vehiculo activo dentro de la organizacion</td>
          </tr>
          <tr>
            <td><strong>Modelo</strong></td>
            <td>Modelo del vehiculo</td>
            <td>Ejemplo: Transit 350, Sprinter 2500</td>
          </tr>
          <tr>
            <td><strong>Año</strong></td>
            <td>Año de fabricacion</td>
            <td>Numerico</td>
          </tr>
          <tr>
            <td><strong>Color</strong></td>
            <td>Color del vehiculo</td>
            <td>Para identificacion visual</td>
          </tr>
          <tr>
            <td><strong>VIN</strong></td>
            <td>Vehicle Identification Number</td>
            <td>Numero de serie unico del fabricante</td>
          </tr>
          <tr>
            <td><strong>Seguro (Insurance)</strong></td>
            <td>Datos del seguro vehicular</td>
            <td>Compania, numero de poliza, fecha de vencimiento</td>
          </tr>
          <tr>
            <td><strong>Registro (Registration)</strong></td>
            <td>Datos de la matricula/registro estatal</td>
            <td>Estado, fecha de vencimiento</td>
          </tr>
          <tr>
            <td><strong>Tipo de vehiculo</strong></td>
            <td>Categoria a la que pertenece</td>
            <td>Ej: Van, Truck, Car, Sprinter, Box Truck</td>
          </tr>
          <tr>
            <td><strong>Estado</strong></td>
            <td>Activo o Inactivo</td>
            <td>Inactivo = desactivacion logica (soft delete)</td>
          </tr>
        </tbody>
      </table>

      <div class="callout">
        <strong>Regla de negocio:</strong> La placa debe ser unica por vehiculo activo dentro de la organizacion.
        Un vehiculo pertenece a una sola organizacion y no se comparte entre organizaciones.
      </div>

      <h3>Desactivacion vs Eliminacion</h3>
      <p>
        Cuando un vehiculo sale de servicio, se <strong>desactiva</strong> en lugar de eliminarlo.
        Esto es un <strong>soft delete</strong> que preserva todo el historial asociado: servicios realizados,
        inspecciones completadas y costos acumulados. El vehiculo deja de aparecer en las vistas operativas
        pero sus datos historicos permanecen accesibles para reportes y auditorias.
      </p>

      <h3>Tipos de Vehiculo</h3>
      <p>
        Los tipos de vehiculo son categorias para clasificar la flota. Ejemplos comunes:
        Van, Truck, Car, Sprinter, Box Truck. Estos tipos se utilizan para:
      </p>
      <ul>
        <li><strong>Agrupacion en reportes y dashboards:</strong> Filtrar y visualizar metricas por tipo de vehiculo.</li>
        <li><strong>Asignacion de plantillas de inspeccion:</strong> Cada tipo puede tener inspecciones especificas.</li>
        <li><strong>Filtrado de flota:</strong> Buscar rapidamente vehiculos de un tipo particular.</li>
      </ul>

      <h3>Categorias de Servicio</h3>
      <p>
        Las categorias de servicio definen que tipos de mantenimiento o trabajo se realizan sobre los vehiculos.
        Cada categoria tiene <strong>campos dinamicos personalizables</strong> que se adaptan al tipo de servicio.
      </p>
      <p>Los tipos de campos dinamicos disponibles son:</p>
      <table>
        <thead>
          <tr>
            <th>Tipo de Campo</th>
            <th>Uso</th>
            <th>Ejemplo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Text</strong></td>
            <td>Informacion descriptiva</td>
            <td>Tipo de aceite utilizado</td>
          </tr>
          <tr>
            <td><strong>Number</strong></td>
            <td>Valores medibles</td>
            <td>Kilometraje actual</td>
          </tr>
          <tr>
            <td><strong>Date</strong></td>
            <td>Fechas relevantes</td>
            <td>Proxima fecha de cambio</td>
          </tr>
          <tr>
            <td><strong>Boolean</strong></td>
            <td>Verificaciones si/no</td>
            <td>Filtro reemplazado</td>
          </tr>
        </tbody>
      </table>

      <p>
        <strong>Ejemplo completo:</strong> Una categoria "Cambio de Aceite" podria tener los siguientes campos dinamicos:
        kilometraje actual (Number), tipo de aceite usado (Text), proxima fecha de cambio (Date),
        filtro reemplazado (Boolean).
      </p>

      <h3>Servicios de Vehiculo</h3>
      <p>
        Un servicio de vehiculo es el <strong>registro de un mantenimiento o trabajo realizado</strong>.
        Cada servicio esta vinculado a una categoria de servicio y hereda sus campos dinamicos.
      </p>
      <p>Informacion que contiene un servicio:</p>
      <ul>
        <li><strong>Vehiculo:</strong> A cual vehiculo se le realizo el servicio.</li>
        <li><strong>Categoria:</strong> Que tipo de servicio se realizo.</li>
        <li><strong>Fecha:</strong> Cuando se realizo.</li>
        <li><strong>Costo:</strong> Cuanto costo el servicio.</li>
        <li><strong>Notas:</strong> Observaciones adicionales.</li>
        <li><strong>Valores de campos dinamicos:</strong> Los datos especificos segun la categoria.</li>
      </ul>

      <div class="callout">
        <strong>Integracion con facturacion:</strong> Al registrar un servicio de vehiculo con costo,
        el sistema puede generar automaticamente una actividad facturable. Esto conecta el mantenimiento
        de flota con el modulo de facturacion.
      </div>

      <h3>Reglas de Negocio Clave</h3>
      <ul>
        <li>Placa unica por vehiculo activo dentro de la organizacion.</li>
        <li>Desactivacion en lugar de eliminacion para preservar historial.</li>
        <li>Campos dinamicos son obligatorios al registrar un servicio.</li>
        <li>Servicios con costo pueden generar actividades facturables automaticamente.</li>
        <li>Vehiculos pertenecen a una organizacion y no se comparten entre organizaciones.</li>
      </ul>
    `,
    test: {
      questions: [
        {
          id: 'c8l1q1',
          question: 'Cual es el identificador unico principal de un vehiculo en el sistema?',
          options: [
            { id: 'b', text: 'La placa (plate)' },
            { id: 'c', text: 'El modelo del vehiculo', explanation: 'El modelo es un campo descriptivo del vehiculo, pero multiples vehiculos pueden compartir el mismo modelo, por lo que no sirve como identificador unico.' },
            { id: 'd', text: 'El numero de poliza de seguro', explanation: 'El numero de poliza forma parte de los datos del seguro vehicular, pero no es el identificador principal del vehiculo en el sistema.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l1q2',
          question: 'Que ocurre cuando un vehiculo sale de servicio?',
          options: [
            { id: 'a', text: 'Se elimina permanentemente del sistema', explanation: 'Eliminar permanentemente destruiria todo el historial de servicios, inspecciones y costos asociados al vehiculo, lo cual el sistema evita deliberadamente.' },
            { id: 'b', text: 'Se transfiere a otra organizacion', explanation: 'Los vehiculos pertenecen a una sola organizacion y no se comparten ni transfieren entre organizaciones.' },
            { id: 'c', text: 'Se desactiva (soft delete) preservando el historial' },
            { id: 'd', text: 'Se archiva y pierde todos los datos asociados', explanation: 'Al desactivar un vehiculo se preserva todo su historial; los datos no se pierden sino que permanecen accesibles para reportes y auditorias.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c8l1q3',
          question: 'Para que se utilizan los tipos de vehiculo?',
          options: [
            { id: 'a', text: 'Unicamente para definir el color del vehiculo en el dashboard', explanation: 'El color del vehiculo es un campo independiente del tipo. Los tipos de vehiculo tienen funciones mucho mas amplias como agrupacion en reportes y asignacion de inspecciones.' },
            { id: 'b', text: 'Para agrupar en reportes, asignar plantillas de inspeccion y filtrar la flota' },
            { id: 'c', text: 'Solo para calcular el costo del seguro', explanation: 'El costo del seguro no se calcula a partir del tipo de vehiculo en el sistema. Los tipos sirven para reportes, inspecciones y filtrado de flota.' },
            { id: 'd', text: 'Exclusivamente para el registro estatal del vehiculo', explanation: 'El registro estatal es un campo separado con sus propios datos. Los tipos de vehiculo se usan para agrupacion en reportes, plantillas de inspeccion y filtrado.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l1q4',
          question: 'Cuales son los tipos de campos dinamicos disponibles en las categorias de servicio?',
          options: [
            { id: 'a', text: 'Text, Number, Date y Boolean' },
            { id: 'b', text: 'String, Integer, Timestamp y Flag', explanation: 'Estos nombres no corresponden a los tipos definidos en el sistema. Los tipos correctos son Text, Number, Date y Boolean.' },
            { id: 'c', text: 'Texto, Imagen, Archivo y Enlace', explanation: 'El sistema no soporta campos de tipo Imagen, Archivo ni Enlace en las categorias de servicio. Los tipos disponibles son Text, Number, Date y Boolean.' },
            { id: 'd', text: 'Descripcion, Cantidad, Calendario y Opcion', explanation: 'Estos no son los nombres de los tipos de campos dinamicos del sistema. Los tipos correctos son Text, Number, Date y Boolean.' }
          ],
          correctOptionId: 'a'
        },
        {
          id: 'c8l1q5',
          question: 'Que sucede al registrar un servicio de vehiculo con costo?',
          options: [
            { id: 'a', text: 'El sistema envia una alerta al administrador solamente', explanation: 'Enviar una alerta no es la funcionalidad principal. Lo que ocurre es que se puede generar automaticamente una actividad facturable vinculada al modulo de facturacion.' },
            { id: 'b', text: 'Se descuenta automaticamente del presupuesto de la organizacion', explanation: 'El sistema no descuenta del presupuesto automaticamente. Lo que hace es generar una actividad facturable que conecta el mantenimiento con el modulo de facturacion.' },
            { id: 'c', text: 'Se puede generar automaticamente una actividad facturable' },
            { id: 'd', text: 'El vehiculo se marca como inactivo temporalmente', explanation: 'Registrar un servicio con costo no afecta el estado del vehiculo. El vehiculo sigue activo y operativo tras el mantenimiento.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c8l1q6',
          question: 'Cual es la regla respecto a las placas de vehiculos?',
          options: [
            { id: 'a', text: 'Las placas pueden repetirse entre vehiculos activos de la misma organizacion', explanation: 'La regla de negocio establece exactamente lo contrario: la placa debe ser unica por vehiculo activo dentro de la organizacion.' },
            { id: 'b', text: 'La placa debe ser unica por vehiculo activo dentro de la organizacion' },
            { id: 'c', text: 'Las placas son unicas a nivel global del sistema entre todas las organizaciones', explanation: 'La unicidad de la placa es a nivel de organizacion, no global. Diferentes organizaciones podrian tener vehiculos con la misma placa.' },
            { id: 'd', text: 'No hay restriccion sobre las placas', explanation: 'Si existe una restriccion: la placa debe ser unica por vehiculo activo dentro de la organizacion para evitar duplicados.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l1q8',
          question: 'Los vehiculos pueden compartirse entre organizaciones?',
          options: [
            { id: 'a', text: 'Si, cualquier organizacion puede usar cualquier vehiculo', explanation: 'El sistema no permite compartir vehiculos. Cada vehiculo pertenece a una sola organizacion para garantizar una gestion independiente de cada flota.' },
            { id: 'b', text: 'Solo si ambas organizaciones estan en la misma region', explanation: 'La ubicacion geografica no cambia la regla. Los vehiculos no se comparten entre organizaciones independientemente de su region.' },
            { id: 'c', text: 'No, cada vehiculo pertenece a una sola organizacion' },
            { id: 'd', text: 'Si, pero solo vehiculos inactivos', explanation: 'Los vehiculos inactivos tampoco se comparten. La regla aplica a todos los vehiculos: cada uno pertenece a una sola organizacion sin excepciones.' }
          ],
          correctOptionId: 'c'
        }
      ]
    }
  },
  {
    title: 'Inspecciones de Flota',
    order: 2,
    content: `
      <h2>Inspecciones de Flota</h2>
      <p>
        Las inspecciones son revisiones periodicas estandarizadas que se realizan sobre los vehiculos
        de la flota. El sistema utiliza <strong>plantillas de inspeccion</strong> para definir que se debe
        revisar, con que frecuencia y para que tipos de vehiculo aplica.
      </p>

      <h3>Plantillas de Inspeccion (Inspection Templates)</h3>
      <p>
        Las plantillas estandarizan las revisiones periodicas. Su estructura incluye:
      </p>
      <ul>
        <li><strong>Nombre:</strong> Identificador descriptivo de la inspeccion (ej: "Inspeccion Pre-Ruta").</li>
        <li><strong>Campos (Fields):</strong> Los items a inspeccionar, cada uno con su tipo de dato.</li>
        <li><strong>Periodicidad:</strong> Con que frecuencia debe realizarse la inspeccion.</li>
        <li><strong>Tipos de vehiculo aplicables:</strong> A que categorias de vehiculo aplica esta plantilla.</li>
      </ul>

      <h3>Periodicidad de Inspecciones</h3>
      <p>Las inspecciones se programan segun su periodicidad:</p>
      <table>
        <thead>
          <tr>
            <th>Periodicidad</th>
            <th>Ejemplo</th>
            <th>Items Tipicos</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Diaria</strong></td>
            <td>Inspeccion pre-ruta</td>
            <td>Luces, frenos, neumaticos, niveles de fluidos</td>
          </tr>
          <tr>
            <td><strong>Semanal</strong></td>
            <td>Revision de seguridad</td>
            <td>Cinturones de seguridad, espejos, limpieza general</td>
          </tr>
          <tr>
            <td><strong>Mensual</strong></td>
            <td>Revision mecanica general</td>
            <td>Motor, transmision, suspension</td>
          </tr>
          <tr>
            <td><strong>Anual</strong></td>
            <td>Inspeccion completa</td>
            <td>Emisiones, certificaciones, documentos vigentes</td>
          </tr>
        </tbody>
      </table>

      <h3>Flujo de Inspeccion</h3>
      <p>El proceso completo de una inspeccion sigue estos pasos:</p>
      <ul>
        <li>
          <strong>1. Creacion de plantilla:</strong> El administrador crea la plantilla de inspeccion
          y la asocia con los tipos de vehiculo correspondientes.
        </li>
        <li>
          <strong>2. Generacion de inspeccion pendiente:</strong> Segun la periodicidad configurada,
          el sistema genera inspecciones pendientes que aparecen en la aplicacion del driver.
        </li>
        <li>
          <strong>3. Ejecucion:</strong> El driver completa cada campo de la inspeccion durante su
          revision del vehiculo, directamente desde la app movil.
        </li>
        <li>
          <strong>4. Registro y supervision:</strong> Los resultados quedan registrados y disponibles
          para que supervisores y administradores los revisen.
        </li>
      </ul>

      <div class="callout">
        <strong>Punto clave:</strong> Los drivers reciben las inspecciones pendientes directamente
        en la aplicacion. Si una inspeccion vence sin completarse, queda marcada como atrasada
        y es visible en el dashboard de flota.
      </div>

      <h3>Dashboard de Flota</h3>
      <p>
        El dashboard de flota proporciona una <strong>vista consolidada</strong> del estado de toda la flota.
        Incluye la siguiente informacion:
      </p>
      <ul>
        <li><strong>Vehiculos activos/inactivos:</strong> Cantidad y estado general de la flota.</li>
        <li><strong>Servicios recientes y costos:</strong> Ultimos mantenimientos realizados y su costo.</li>
        <li><strong>Inspecciones pendientes/atrasadas:</strong> Cuales inspecciones faltan por completar o estan vencidas.</li>
        <li><strong>Costos acumulados por vehiculo/categoria:</strong> Cuanto se ha gastado en cada vehiculo o tipo de servicio.</li>
        <li><strong>Documentos por vencer:</strong> Alertas de seguros y registros proximos a expirar.</li>
      </ul>

      <h3>Reglas de Negocio de Inspecciones</h3>
      <ul>
        <li>Las plantillas se asocian por tipo de vehiculo. Si un vehiculo cambia de tipo, las plantillas aplicables se ajustan automaticamente.</li>
        <li>Las inspecciones atrasadas se destacan visualmente en el dashboard para atencion inmediata.</li>
        <li>El historial de inspecciones se preserva incluso si el vehiculo se desactiva.</li>
        <li>Los campos de la inspeccion son obligatorios: el driver debe completar todos los items.</li>
      </ul>

      <div class="callout warning">
        <strong>Importante:</strong> Las plantillas de inspeccion se asocian por tipo de vehiculo.
        Si un vehiculo cambia de tipo, las plantillas aplicables se ajustan automaticamente.
        Esto significa que un vehiculo reclasificado de "Van" a "Truck" comenzara a recibir
        las inspecciones correspondientes al tipo "Truck".
      </div>
    `,
    test: {
      questions: [
        {
          id: 'c8l2q1',
          question: 'Que elementos componen una plantilla de inspeccion?',
          options: [
            { id: 'a', text: 'Solo nombre y periodicidad', explanation: 'Esta respuesta es incompleta. Ademas del nombre y la periodicidad, las plantillas incluyen campos a inspeccionar y los tipos de vehiculo aplicables.' },
            { id: 'b', text: 'Nombre, campos a inspeccionar, periodicidad y tipos de vehiculo aplicables' },
            { id: 'c', text: 'Nombre, costo estimado y responsable', explanation: 'Las plantillas de inspeccion no incluyen costo estimado ni responsable. Sus componentes son nombre, campos, periodicidad y tipos de vehiculo aplicables.' },
            { id: 'd', text: 'Campos a inspeccionar y fecha limite unicamente', explanation: 'Las plantillas no tienen fecha limite. Ademas de los campos a inspeccionar, incluyen nombre, periodicidad y tipos de vehiculo aplicables.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l2q2',
          question: 'Cual es la periodicidad tipica de una inspeccion pre-ruta?',
          options: [
            { id: 'a', text: 'Semanal', explanation: 'La periodicidad semanal corresponde a revisiones de seguridad (cinturones, espejos, limpieza), no a inspecciones pre-ruta que se realizan antes de cada jornada.' },
            { id: 'b', text: 'Mensual', explanation: 'La periodicidad mensual es para revisiones mecanicas generales (motor, transmision, suspension). La inspeccion pre-ruta se realiza diariamente.' },
            { id: 'c', text: 'Diaria' },
            { id: 'd', text: 'Anual', explanation: 'La periodicidad anual corresponde a inspecciones completas como emisiones y certificaciones. La inspeccion pre-ruta es diaria, antes de cada jornada.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c8l2q3',
          question: 'Donde ven los drivers las inspecciones pendientes?',
          options: [
            { id: 'a', text: 'Por correo electronico', explanation: 'Las inspecciones no se envian por correo electronico. Los drivers las reciben directamente en la aplicacion movil.' },
            { id: 'b', text: 'En la aplicacion SyncFlex' },
            { id: 'c', text: 'En el panel web de administracion', explanation: 'El panel web de administracion es para supervisores y administradores. Los drivers reciben sus inspecciones en la app movil.' },
            { id: 'd', text: 'Mediante una llamada telefonica del supervisor', explanation: 'Las inspecciones se asignan de forma automatica segun la periodicidad configurada, no mediante comunicacion telefonica. Se reciben en la app.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l2q4',
          question: 'Que informacion muestra el dashboard de flota?',
          options: [
            { id: 'a', text: 'Solo el listado de vehiculos activos', explanation: 'El dashboard es mucho mas completo que un simple listado. Incluye servicios recientes, inspecciones pendientes, costos acumulados y documentos por vencer.' },
            { id: 'b', text: 'Vehiculos activos/inactivos, servicios recientes, inspecciones pendientes, costos acumulados y documentos por vencer' },
            { id: 'c', text: 'Unicamente los costos de mantenimiento', explanation: 'Los costos de mantenimiento son solo una parte del dashboard. Tambien muestra vehiculos, inspecciones, servicios recientes y documentos por vencer.' },
            { id: 'd', text: 'Solo las inspecciones completadas del ultimo mes', explanation: 'El dashboard no se limita a inspecciones completadas. Es una vista consolidada con multiples indicadores incluyendo inspecciones pendientes y atrasadas.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l2q5',
          question: 'Que sucede si un vehiculo cambia de tipo (por ejemplo, de Van a Truck)?',
          options: [
            { id: 'a', text: 'Mantiene las plantillas de inspeccion del tipo anterior', explanation: 'Las plantillas se asocian por tipo de vehiculo, asi que al cambiar el tipo, las plantillas del tipo anterior dejan de aplicar y se asignan las del nuevo tipo automaticamente.' },
            { id: 'b', text: 'Pierde todas las inspecciones pendientes', explanation: 'El vehiculo no pierde inspecciones. Al cambiar de tipo, las plantillas aplicables se ajustan automaticamente y recibira las inspecciones correspondientes al nuevo tipo.' },
            { id: 'c', text: 'Las plantillas aplicables se ajustan automaticamente al nuevo tipo' },
            { id: 'd', text: 'Debe eliminarse y crearse de nuevo con el nuevo tipo', explanation: 'No es necesario eliminar y recrear el vehiculo. El sistema ajusta automaticamente las plantillas de inspeccion al nuevo tipo asignado.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c8l2q6',
          question: 'Que items se revisan tipicamente en una inspeccion semanal de seguridad?',
          options: [
            { id: 'a', text: 'Motor, transmision y suspension', explanation: 'Estos items corresponden a la revision mecanica general de periodicidad mensual, no a la inspeccion semanal de seguridad.' },
            { id: 'b', text: 'Emisiones, certificaciones y documentos', explanation: 'Estos items corresponden a la inspeccion completa de periodicidad anual, no a la revision semanal de seguridad.' },
            { id: 'c', text: 'Cinturones de seguridad, espejos y limpieza general' },
            { id: 'd', text: 'Luces, frenos y neumaticos', explanation: 'Estos items corresponden a la inspeccion pre-ruta de periodicidad diaria, no a la revision semanal de seguridad.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c8l2q7',
          question: 'Quien crea las plantillas de inspeccion en el sistema?',
          options: [
            { id: 'a', text: 'Los drivers desde la app movil', explanation: 'Los drivers solo completan las inspecciones desde la app movil. La creacion de plantillas es responsabilidad del administrador.' },
            { id: 'b', text: 'El administrador desde el panel de administracion' },
            { id: 'c', text: 'El sistema las genera automaticamente', explanation: 'El sistema genera las inspecciones pendientes automaticamente segun la periodicidad, pero las plantillas las crea manualmente el administrador.' },
            { id: 'd', text: 'Los clientes finales', explanation: 'Los clientes finales no tienen acceso al sistema de gestion de flota ni a la creacion de plantillas de inspeccion.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l2q8',
          question: 'Que ocurre con una inspeccion que vence sin completarse?',
          options: [
            { id: 'a', text: 'Se elimina automaticamente del sistema', explanation: 'Las inspecciones vencidas no se eliminan. Quedan registradas como atrasadas y se destacan visualmente en el dashboard para atencion inmediata.' },
            { id: 'b', text: 'Se reprograma para la semana siguiente', explanation: 'Las inspecciones vencidas no se reprograman automaticamente. Quedan marcadas como atrasadas y visibles en el dashboard de flota.' },
            { id: 'c', text: 'Queda marcada como atrasada y es visible en el dashboard de flota' },
            { id: 'd', text: 'Se asigna automaticamente a otro driver', explanation: 'El sistema no reasigna inspecciones vencidas a otros drivers. La inspeccion queda marcada como atrasada para que un supervisor tome accion.' }
          ],
          correctOptionId: 'c'
        }
      ]
    }
  },
  {
    title: 'Anomalias Automaticas',
    order: 3,
    content: `
      <h2>Anomalias Automaticas</h2>
      <p>
        Las anomalias son <strong>alertas generadas automaticamente</strong> por el sistema cuando detecta
        una transicion de estado invalida en un envio. Es fundamental entender que las anomalias son un
        <strong>mecanismo de deteccion, no de bloqueo</strong>: la operacion siempre continua y la anomalia
        se registra en paralelo para revision posterior.
      </p>

      <div class="callout">
        <strong>Principio de No Bloqueo:</strong> La operacion SIEMPRE se completa. Si un operador escanea
        un envio durante un proceso de inbound, el envio ingresa al almacen independientemente de si la
        transicion de estado es valida o no. La anomalia se registra en paralelo para revision posterior.
        Este principio existe porque en un almacen de alto volumen, detener la operacion por una transicion
        invalida causa mas problemas que registrar la anomalia para revision.
      </div>

      <h3>Tipos de Anomalias</h3>
      <table>
        <thead>
          <tr>
            <th>Codigo</th>
            <th>Nombre</th>
            <th>Descripcion</th>
            <th>Ejemplo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>AT01</strong></td>
            <td>Estado inicial inesperado</td>
            <td>El envio deberia estar en el estado inicial del journey al entrar a un nodo, pero tiene un estado diferente</td>
            <td>Un envio llega al warehouse con estado "out_for_delivery" en vez de "order_received"</td>
          </tr>
          <tr>
            <td><strong>AT02</strong></td>
            <td>Transicion no encontrada</td>
            <td>No existe una relacion valida en el grafo de estados de Neo4j entre el estado actual y el estado destino</td>
            <td>Un envio en estado "delivered" es escaneado como "warehouse"</td>
          </tr>
          <tr>
            <td><strong>AT03</strong></td>
            <td>Transicion recursiva</td>
            <td>Se intenta cambiar el envio al mismo estado en el que ya se encuentra</td>
            <td>Un envio ya esta en "warehouse" y se escanea nuevamente en inbound</td>
          </tr>
        </tbody>
      </table>

      <h3>Cuando se Generan Anomalias</h3>
      <p>
        Las anomalias pueden generarse en cualquier proceso que cambie el estado de un envio:
      </p>
      <ul>
        <li><strong>Escaneos masivos (bulk scans):</strong> Durante procesos de inbound o outbound en almacen.</li>
        <li><strong>Actualizaciones desde apps:</strong> Cambios de estado desde SyncPod o Picoville.</li>
        <li><strong>Rutas flex:</strong> Actualizaciones de estado durante entregas flex.</li>
        <li><strong>Actualizaciones manuales:</strong> Cambios de estado realizados manualmente por operadores.</li>
      </ul>

      <h3>Informacion Capturada en una Anomalia</h3>
      <p>Cada anomalia registra los siguientes datos:</p>
      <ul>
        <li><strong>Envio:</strong> ID del envio y numero de tracking.</li>
        <li><strong>Estado actual:</strong> El estado en que se encontraba el envio.</li>
        <li><strong>Estado propuesto:</strong> El estado al que se intentaba cambiar.</li>
        <li><strong>Tipo de anomalia:</strong> AT01, AT02 o AT03.</li>
        <li><strong>Fecha de deteccion:</strong> Momento exacto en que se genero.</li>
        <li><strong>Resuelta:</strong> Si/No, indicando si ya fue revisada.</li>
        <li><strong>Organizacion:</strong> A que organizacion pertenece.</li>
      </ul>

      <h3>Resolucion de Anomalias</h3>
      <p>
        Las anomalias se pueden resolver de forma <strong>individual o en lote (batch)</strong>.
        Es importante entender que la resolucion <strong>NO revierte el cambio de estado</strong>
        que se realizo. Resolver una anomalia simplemente indica que alguien la reviso y
        considero que el estado actual es aceptable.
      </p>

      <div class="callout warning">
        <strong>Atencion:</strong> Resolver una anomalia NO deshace el cambio de estado que la genero.
        El envio mantiene el estado al que fue cambiado. La resolucion solo significa que un supervisor
        reviso la situacion y la acepto.
      </div>

      <h3>Relacion con los Journeys</h3>
      <p>
        Las anomalias estan directamente relacionadas con la configuracion de journeys en el sistema:
      </p>
      <ul>
        <li><strong>AT01:</strong> Compara el estado del envio con el estado inicial definido en el journey.</li>
        <li><strong>AT02:</strong> Verifica si existe una relacion NEXT en el grafo de estados de Neo4j entre el estado actual y el propuesto.</li>
        <li><strong>AT03:</strong> Compara si los estados (actual y propuesto) son identicos.</li>
      </ul>
      <p>
        Si los journeys se actualizan agregando nuevas transiciones validas, las anomalias AT02
        dejarian de generarse para esas transiciones que ahora son validas.
      </p>
    `,
    test: {
      questions: [
        {
          id: 'c8l3q1',
          question: 'Cual es el principio fundamental de las anomalias en el sistema?',
          options: [
            { id: 'a', text: 'Bloquean la operacion hasta que un supervisor apruebe el cambio', explanation: 'Las anomalias nunca bloquean la operacion. En un almacen de alto volumen, detener la operacion causa mas problemas que registrar la anomalia para revision posterior.' },
            { id: 'b', text: 'Son un mecanismo de deteccion, no de bloqueo: la operacion siempre continua' },
            { id: 'c', text: 'Revierten automaticamente el cambio de estado invalido', explanation: 'Las anomalias no revierten ningun cambio. La operacion se completa normalmente y la anomalia se registra en paralelo para revision posterior.' },
            { id: 'd', text: 'Notifican al cliente sobre el problema con su envio', explanation: 'Las anomalias no tienen interaccion con el cliente. Son un mecanismo interno de deteccion que registra transiciones de estado invalidas para revision del equipo.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l3q4',
          question: 'Que ocurre al resolver una anomalia?',
          options: [
            { id: 'a', text: 'Se revierte el cambio de estado que la genero', explanation: 'Resolver una anomalia no revierte ningun cambio de estado. El envio mantiene el estado al que fue cambiado; la resolucion solo marca que alguien la reviso.' },
            { id: 'b', text: 'Se elimina el envio del sistema', explanation: 'Las anomalias no afectan la existencia del envio. Resolver una anomalia simplemente indica que fue revisada y el estado actual se considera aceptable.' },
            { id: 'c', text: 'Solo se indica que alguien la reviso y la considero aceptable, sin revertir el estado' },
            { id: 'd', text: 'Se bloquea el envio para evitar futuros cambios', explanation: 'Las anomalias nunca bloquean envios. Resolver una anomalia es un acto de revision que no modifica ni restringe el envio de ninguna forma.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c8l3q5',
          question: 'En que procesos se pueden generar anomalias?',
          options: [
            { id: 'a', text: 'Solo en escaneos masivos de almacen', explanation: 'Los escaneos masivos son solo uno de los procesos. Las anomalias tambien se generan desde apps moviles, rutas flex y actualizaciones manuales.' },
            { id: 'b', text: 'En cualquier proceso que cambie el estado: escaneos masivos, apps, rutas flex y actualizaciones manuales' },
            { id: 'c', text: 'Unicamente en actualizaciones manuales por operadores', explanation: 'Las actualizaciones manuales son solo una de las fuentes. Las anomalias se generan en cualquier proceso que cambie el estado, incluyendo escaneos masivos y apps moviles.' },
            { id: 'd', text: 'Solo cuando el envio llega al warehouse', explanation: 'La llegada al warehouse es solo un escenario. Las anomalias se detectan en cualquier proceso que cambie el estado de un envio, sin importar el nodo o etapa.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l3q6',
          question: 'Por que el sistema no bloquea la operacion cuando detecta una transicion invalida?',
          options: [
            { id: 'a', text: 'Porque el sistema no tiene capacidad tecnica para bloquear', explanation: 'El sistema si tiene capacidad de bloqueo (los issues NMI y BLOCKED lo demuestran). La decision de no bloquear en anomalias es una regla de negocio, no una limitacion tecnica.' },
            { id: 'b', text: 'Porque en un almacen de alto volumen, detener la operacion causa mas problemas que registrar la anomalia' },
            { id: 'c', text: 'Porque las transiciones invalidas no son importantes', explanation: 'Las transiciones invalidas si son importantes y requieren revision. Sin embargo, en operaciones de alto volumen es preferible registrarlas como anomalias que detener el flujo operativo.' },
            { id: 'd', text: 'Porque el cliente ya fue notificado previamente', explanation: 'Las anomalias no involucran al cliente. La razon del no bloqueo es operativa: en almacenes de alto volumen, detener la operacion genera mas problemas que la anomalia misma.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l3q7',
          question: 'Que relacion tiene la anomalia AT02 con el grafo de estados en Neo4j?',
          options: [
            { id: 'a', text: 'Verifica que el nodo de destino exista en Neo4j', explanation: 'AT02 no verifica la existencia de nodos sino de relaciones. Comprueba si hay una relacion NEXT valida entre el estado actual y el estado propuesto.' },
            { id: 'b', text: 'Comprueba si existe una relacion NEXT valida entre el estado actual y el propuesto' },
            { id: 'c', text: 'Valida que el usuario tenga permisos en Neo4j', explanation: 'AT02 no se relaciona con permisos de usuario. Se enfoca en validar que exista una transicion NEXT valida entre estados en el grafo de Neo4j.' },
            { id: 'd', text: 'Verifica la conexion con la base de datos Neo4j', explanation: 'AT02 no es una verificacion de conectividad. Es una validacion de negocio que comprueba si la transicion de estado es valida segun el grafo de relaciones NEXT.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l3q8',
          question: 'Que pasa si se actualiza un journey agregando nuevas transiciones validas?',
          options: [
            { id: 'a', text: 'Las anomalias existentes se eliminan automaticamente', explanation: 'Las anomalias ya registradas no se eliminan retroactivamente. Lo que cambia es que futuras transiciones de ese tipo ya no generaran anomalias AT02.' },
            { id: 'b', text: 'Las anomalias AT02 dejarian de generarse para esas transiciones ahora validas' },
            { id: 'c', text: 'Todos los envios afectados se reproceson automaticamente', explanation: 'No se reprocesa ningun envio. Las anomalias pasadas quedan registradas y las nuevas transiciones validas simplemente dejan de generar futuras anomalias AT02.' },
            { id: 'd', text: 'No tiene ningun efecto sobre las anomalias', explanation: 'Si tiene efecto: al agregar transiciones validas al journey, esas transiciones ya no se consideran invalidas y no generaran anomalias AT02 en el futuro.' }
          ],
          correctOptionId: 'b'
        }
      ]
    }
  },
  {
    title: 'Sistema de Issues',
    order: 4,
    content: `
      <h2>Sistema de Issues</h2>
      <p>
        Los issues son <strong>reportes manuales o automaticos</strong> que se crean cuando se identifica
        un problema operativo que requiere seguimiento. A diferencia de las anomalias (que son automaticas
        y no bloquean), los issues pueden ser creados manualmente y algunos tipos <strong>si bloquean</strong>
        el envio hasta su resolucion.
      </p>

      <h3>Creacion de Issues</h3>
      <p>Los issues pueden crearse de dos formas:</p>
      <ul>
        <li><strong>Manual:</strong> Un operador o supervisor crea el issue cuando identifica un problema.</li>
        <li><strong>Automatica:</strong> El sistema crea issues NMI automaticamente cuando una entrega falla.</li>
      </ul>

      <p><strong>Requisitos para crear un issue:</strong></p>
      <ul>
        <li>El envio debe existir y estar activo.</li>
        <li>El envio debe estar abierto o entregado.</li>
        <li>No debe existir otro issue abierto para el mismo envio.</li>
        <li>Debe incluir al menos un comentario inicial.</li>
        <li>Para envios replicados, se debe hacer reinbound primero.</li>
      </ul>

      <h3>Tipos de Issues</h3>
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Nombre</th>
            <th>Bloquea Envio</th>
            <th>Uso Principal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>NMI</strong></td>
            <td>No More Information</td>
            <td>SI</td>
            <td>Se necesita mas informacion del cliente para entregar (problemas de direccion)</td>
          </tr>
          <tr>
            <td><strong>UNDER_RESEARCH</strong></td>
            <td>Bajo Investigacion</td>
            <td>NO</td>
            <td>Problema siendo investigado internamente (posible dano, discrepancia de contenido)</td>
          </tr>
          <tr>
            <td><strong>BLOCKED</strong></td>
            <td>Bloqueado</td>
            <td>SI</td>
            <td>Envio retenido hasta resolucion (retencion documental, problema legal, instrucciones del shipper)</td>
          </tr>
        </tbody>
      </table>

      <h3>Flujo NMI (No More Information)</h3>
      <p>El flujo NMI es el mas complejo y frecuente. Sigue estos pasos:</p>
      <ul>
        <li><strong>1. Deteccion:</strong> Se identifica un envio que no puede entregarse (generalmente por problemas de direccion).</li>
        <li><strong>2. Creacion del issue NMI:</strong> Se crea el issue y el envio queda bloqueado en el almacen.</li>
        <li><strong>3. Generacion de enlace unico:</strong> El sistema genera un enlace unico para que el cliente actualice la direccion.</li>
        <li><strong>4. Envio opcional de SMS:</strong> Se puede enviar un SMS al cliente con el enlace.</li>
        <li><strong>5. Resolucion por el cliente:</strong> El cliente accede al enlace, actualiza la direccion y el issue se resuelve automaticamente.</li>
        <li><strong>6. Resolucion manual:</strong> Si el cliente no responde, el operador resuelve manualmente.</li>
      </ul>

      <h3>Acciones de Resolucion por Tipo</h3>

      <h4>Resolucion NMI</h4>
      <table>
        <thead>
          <tr>
            <th>Accion</th>
            <th>Efecto</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Sin accion</strong></td>
            <td>Cierra el issue y desbloquea el envio. Si el envio esta en warehouse, se convierte a BLOCKED.</td>
          </tr>
          <tr>
            <td><strong>Actualizar direccion</strong></td>
            <td>Actualiza la direccion del envio y desbloquea. Si esta en warehouse, se convierte a BLOCKED.</td>
          </tr>
          <tr>
            <td><strong>RTS (Return to Sender)</strong></td>
            <td>Convierte el issue a BLOCKED con accion de devolucion al remitente.</td>
          </tr>
          <tr>
            <td><strong>Resolucion por cliente</strong></td>
            <td>El cliente resuelve automaticamente a traves del enlace web.</td>
          </tr>
        </tbody>
      </table>

      <h4>Resolucion UNDER_RESEARCH</h4>
      <table>
        <thead>
          <tr>
            <th>Accion</th>
            <th>Efecto</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Sin accion</strong></td>
            <td>Cierra el issue sin cambios en el envio.</td>
          </tr>
          <tr>
            <td><strong>Mover a perdido (lost)</strong></td>
            <td>Cierra el issue y cambia el estado del envio a "lost". Si estaba entregado, se marca como takeover.</td>
          </tr>
        </tbody>
      </table>

      <h4>Resolucion BLOCKED</h4>
      <p>
        Los issues BLOCKED ofrecen acciones de: reimprimir etiqueta, dejar en warehouse, o mover a RTS.
        La resolucion final se realiza unicamente mediante la accion "sin accion" que desbloquea el envio.
        Cuando un issue BLOCKED proviene de un NMI, se mantiene un flag <code>fromNMI</code> para trazabilidad.
      </p>

      <h3>Barcodes Asociados</h3>
      <p>
        Un issue puede tener <strong>barcodes asociados</strong> mas alla del barcode principal.
        El sistema agrupa automaticamente envios con problemas de direccion similares bajo un mismo issue NMI,
        permitiendo resolver multiples envios relacionados de una sola vez.
      </p>

      <h3>Comentarios</h3>
      <p>
        Los comentarios son fundamentales en el sistema de issues:
      </p>
      <ul>
        <li>Es obligatorio agregar al menos un comentario al crear el issue.</li>
        <li>Cualquier persona con permisos puede agregar comentarios adicionales.</li>
        <li>Los comentarios se almacenan cronologicamente.</li>
        <li>El sistema agrega comentarios automaticos (ej: "Closed By System" cuando se entrega el envio).</li>
      </ul>

      <h3>Cierre Automatico de Issues</h3>
      <p>El sistema cierra issues automaticamente en dos escenarios:</p>
      <ul>
        <li><strong>Al entregar el envio:</strong> Todos los issues abiertos se cierran con el comentario "Closed By System".</li>
        <li><strong>Limpieza periodica:</strong> Se cierran issues BLOCKED para envios en estado "never_received".</li>
      </ul>

      <h3>Diferencia entre Anomalias e Issues</h3>
      <table>
        <thead>
          <tr>
            <th>Aspecto</th>
            <th>Anomalia</th>
            <th>Issue</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Origen</strong></td>
            <td>Automatico (sistema detecta)</td>
            <td>Manual o automatico (NMI)</td>
          </tr>
          <tr>
            <td><strong>Bloquea envio</strong></td>
            <td>Nunca</td>
            <td>NMI y BLOCKED si bloquean</td>
          </tr>
          <tr>
            <td><strong>Resolucion</strong></td>
            <td>Marcar como revisada</td>
            <td>Investigacion con acciones concretas</td>
          </tr>
          <tr>
            <td><strong>Interaccion con cliente</strong></td>
            <td>Ninguna</td>
            <td>NMI ofrece enlace de autoservicio</td>
          </tr>
          <tr>
            <td><strong>Proposito</strong></td>
            <td>Auditar transiciones invalidas</td>
            <td>Gestionar problemas operativos</td>
          </tr>
        </tbody>
      </table>
    `,
    test: {
      questions: [
        {
          id: 'c8l4q1',
          question: 'Que tipos de issues bloquean el envio?',
          options: [
            { id: 'a', text: 'Solo UNDER_RESEARCH', explanation: 'UNDER_RESEARCH es precisamente el unico tipo que NO bloquea el envio. Los que si bloquean son NMI y BLOCKED.' },
            { id: 'b', text: 'NMI y BLOCKED' },
            { id: 'c', text: 'Todos los tipos bloquean', explanation: 'No todos bloquean. UNDER_RESEARCH no bloquea el envio ya que es para investigacion interna. Solo NMI y BLOCKED retienen el envio hasta su resolucion.' },
            { id: 'd', text: 'Ningun tipo bloquea el envio', explanation: 'Esto es incorrecto. A diferencia de las anomalias (que nunca bloquean), los issues NMI y BLOCKED si bloquean el envio hasta que se resuelvan.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l4q2',
          question: 'Cual es un requisito obligatorio al crear un issue?',
          options: [
            { id: 'a', text: 'Adjuntar una foto del envio', explanation: 'No es obligatorio adjuntar fotos para crear un issue. El requisito obligatorio es incluir al menos un comentario inicial que describa el problema.' },
            { id: 'b', text: 'Incluir al menos un comentario inicial' },
            { id: 'c', text: 'Obtener aprobacion del supervisor', explanation: 'No se requiere aprobacion previa de un supervisor para crear un issue. El requisito es incluir un comentario inicial descriptivo.' },
            { id: 'd', text: 'Especificar la fecha de resolucion esperada', explanation: 'La fecha de resolucion no es un campo requerido al crear un issue. Lo obligatorio es incluir al menos un comentario inicial.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l4q3',
          question: 'Como se resuelve automaticamente un issue NMI?',
          options: [
            { id: 'a', text: 'Se cierra automaticamente despues de 24 horas', explanation: 'Los issues NMI no tienen cierre por tiempo automatico. Se resuelven cuando el cliente actualiza la direccion a traves del enlace unico o cuando un operador lo resuelve manualmente.' },
            { id: 'b', text: 'El cliente accede al enlace unico, actualiza la direccion y el issue se resuelve' },
            { id: 'c', text: 'El sistema reasigna el envio a otro driver', explanation: 'El flujo NMI no implica reasignacion de drivers. Se genera un enlace unico para que el cliente actualice su direccion y resuelva el problema.' },
            { id: 'd', text: 'El supervisor lo aprueba desde el panel de administracion', explanation: 'La resolucion automatica no requiere intervencion del supervisor. El cliente accede directamente al enlace unico generado por el sistema para actualizar su direccion.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l4q4',
          question: 'Que ocurre cuando se resuelve un UNDER_RESEARCH con la accion "Mover a perdido"?',
          options: [
            { id: 'a', text: 'Se cierra el issue y el envio vuelve al warehouse', explanation: 'La accion "Mover a perdido" no devuelve el envio al warehouse. Cambia el estado del envio a "lost", indicando que se considera extraviado.' },
            { id: 'b', text: 'Se cierra el issue y se cambia el estado a "lost". Si estaba entregado, se marca como takeover.' },
            { id: 'c', text: 'Se transfiere el issue a otro departamento', explanation: 'Los issues no se transfieren entre departamentos. La accion "Mover a perdido" cierra el issue y marca el envio con estado "lost".' },
            { id: 'd', text: 'Se crea automaticamente un issue BLOCKED', explanation: 'No se crea un issue BLOCKED. La accion "Mover a perdido" cierra el issue directamente y cambia el estado del envio a "lost".' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l4q5',
          question: 'Que sucede con los issues abiertos cuando un envio se entrega?',
          options: [
            { id: 'a', text: 'Los issues permanecen abiertos para revision posterior', explanation: 'Los issues no permanecen abiertos tras la entrega. El sistema los cierra automaticamente todos al entregar el envio, agregando el comentario "Closed By System".' },
            { id: 'b', text: 'Todos los issues abiertos se cierran automaticamente con el comentario "Closed By System"' },
            { id: 'c', text: 'Solo se cierran los issues NMI', explanation: 'El cierre automatico al entregar aplica a todos los tipos de issues abiertos del envio, no solo a los NMI.' },
            { id: 'd', text: 'Se archivan para referencia futura', explanation: 'Los issues no se archivan; se cierran automaticamente con el comentario "Closed By System" cuando el envio se entrega exitosamente.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l4q6',
          question: 'Cual es la diferencia principal entre una anomalia y un issue?',
          options: [
            { id: 'a', text: 'Las anomalias son mas graves que los issues', explanation: 'La diferencia no es de gravedad sino de naturaleza. Las anomalias son detecciones automaticas que no bloquean, mientras que los issues gestionan problemas operativos y pueden bloquear.' },
            { id: 'b', text: 'Las anomalias nunca bloquean y son automaticas; los issues pueden bloquear y pueden ser manuales' },
            { id: 'c', text: 'Los issues son automaticos y las anomalias son manuales', explanation: 'Es al reves: las anomalias son siempre automaticas, mientras que los issues pueden ser manuales o automaticos (como los NMI creados automaticamente al fallar una entrega).' },
            { id: 'd', text: 'No hay diferencia, son el mismo concepto con diferente nombre', explanation: 'Son conceptos distintos. Las anomalias auditan transiciones de estado invalidas sin bloquear, mientras que los issues gestionan problemas operativos con acciones concretas de resolucion.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l4q7',
          question: 'Que es el flag fromNMI en un issue BLOCKED?',
          options: [
            { id: 'a', text: 'Indica que el issue fue creado por un cliente', explanation: 'El flag fromNMI no se refiere a quien creo el issue. Indica que el issue BLOCKED fue convertido desde un NMI previo, manteniendo la trazabilidad del origen.' },
            { id: 'b', text: 'Indica que el issue BLOCKED proviene de un NMI para mantener trazabilidad' },
            { id: 'c', text: 'Indica que el issue tiene prioridad alta', explanation: 'El flag fromNMI no tiene relacion con la prioridad. Su funcion es marcar que el issue BLOCKED se origino a partir de un NMI para fines de trazabilidad.' },
            { id: 'd', text: 'Indica que el NMI fue resuelto exitosamente', explanation: 'El flag no indica resolucion exitosa. Cuando un NMI se convierte a BLOCKED (por ejemplo, al aplicar RTS), el flag fromNMI marca ese origen para mantener trazabilidad.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l4q8',
          question: 'Se puede crear un issue si ya existe otro issue abierto para el mismo envio?',
          options: [
            { id: 'a', text: 'Si, se pueden crear multiples issues sin restriccion', explanation: 'Existe una restriccion explicita: no debe existir otro issue abierto para el mismo envio. Esto evita duplicacion de reportes sobre el mismo problema.' },
            { id: 'b', text: 'No, no debe existir otro issue abierto para el mismo envio' },
            { id: 'c', text: 'Solo si son de tipos diferentes', explanation: 'La restriccion aplica independientemente del tipo. No se permite crear ningun issue nuevo mientras exista otro abierto para el mismo envio.' },
            { id: 'd', text: 'Solo si el issue existente es de tipo UNDER_RESEARCH', explanation: 'No hay excepciones por tipo. La regla es clara: no puede haber mas de un issue abierto por envio, sin importar el tipo del issue existente.' }
          ],
          correctOptionId: 'b'
        }
      ]
    }
  },
  {
    title: 'Excepciones de Servicio',
    order: 5,
    content: `
      <h2>Excepciones de Servicio</h2>
      <p>
        Las excepciones de servicio representan <strong>eventos extraordinarios externos</strong> que afectan
        las operaciones de entrega en rutas o zonas especificas. Su proposito principal es justificar
        retrasos y el incumplimiento de SLAs (Service Level Agreements) cuando estos son causados por
        factores fuera del control de la operacion.
      </p>

      <h3>Informacion de una Excepcion</h3>
      <table>
        <thead>
          <tr>
            <th>Campo</th>
            <th>Descripcion</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Nombre del evento</strong></td>
            <td>Identificador descriptivo del evento (ej: "Tormenta tropical en zona norte")</td>
          </tr>
          <tr>
            <td><strong>Descripcion</strong></td>
            <td>Detalle completo del evento y su impacto</td>
          </tr>
          <tr>
            <td><strong>Rutas afectadas</strong></td>
            <td>Seleccion de las rutas impactadas por el evento</td>
          </tr>
          <tr>
            <td><strong>Codigos postales</strong></td>
            <td>Calculados automaticamente a partir de las rutas seleccionadas</td>
          </tr>
          <tr>
            <td><strong>Fecha de fin</strong></td>
            <td>Opcional. Cuando se espera que el evento termine.</td>
          </tr>
          <tr>
            <td><strong>Visibilidad</strong></td>
            <td>Publica o Privada</td>
          </tr>
          <tr>
            <td><strong>Estado</strong></td>
            <td>Activa o Cerrada</td>
          </tr>
          <tr>
            <td><strong>Descripcion de resolucion</strong></td>
            <td>Detalle de como se resolvio el evento (al cerrar)</td>
          </tr>
        </tbody>
      </table>

      <h3>Visibilidad: Publica vs Privada</h3>
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Visible Para</th>
            <th>Uso</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Publica</strong></td>
            <td>Todos, incluyendo clientes y shippers</td>
            <td>Comunicacion proactiva de interrupciones de servicio al exterior</td>
          </tr>
          <tr>
            <td><strong>Privada</strong></td>
            <td>Solo el equipo interno</td>
            <td>Eventos que afectan operaciones pero no requieren comunicacion externa</td>
          </tr>
        </tbody>
      </table>

      <div class="callout">
        <strong>Ejemplo practico:</strong> Una tormenta severa que impide entregas en varias rutas seria
        una excepcion <strong>publica</strong>, ya que los clientes deben saber por que sus envios se retrasan.
        Un problema interno con un vehiculo que afecta una ruta especifica podria ser una excepcion
        <strong>privada</strong>, ya que es un tema operativo interno.
      </div>

      <h3>Asociacion Geografica por Rutas</h3>
      <p>
        El mecanismo de asociacion geografica funciona de la siguiente manera:
      </p>
      <ul>
        <li><strong>1.</strong> El operador selecciona las rutas afectadas por el evento.</li>
        <li><strong>2.</strong> El sistema consulta todos los codigos postales asociados a esas rutas.</li>
        <li><strong>3.</strong> Cualquier envio cuyo destino sea uno de esos codigos postales queda cubierto por la excepcion.</li>
      </ul>
      <p>
        De esta forma, no es necesario seleccionar envios individualmente. Al seleccionar las rutas,
        el sistema automaticamente identifica todos los envios potencialmente afectados.
      </p>

      <h3>Ciclo de Vida de una Excepcion</h3>
      <p>
        Una excepcion pasa por las siguientes etapas:
      </p>
      <ul>
        <li><strong>Creacion:</strong> Se registra el evento con toda su informacion. El estado inicial es <strong>ACTIVA</strong>.</li>
        <li>
          <strong>Cierre:</strong> La excepcion puede cerrarse de tres formas:
          <ul>
            <li><strong>Cierre manual:</strong> Un operador cierra la excepcion e incluye una descripcion de resolucion.</li>
            <li><strong>Cierre automatico por fecha:</strong> Si se definio una fecha de fin, el sistema cierra la excepcion al llegar esa fecha.</li>
            <li><strong>Alerta por inactividad:</strong> Si una excepcion lleva mas de 3 dias activa sin fecha de fin, el sistema genera una alerta.</li>
          </ul>
        </li>
      </ul>

      <div class="callout warning">
        <strong>Alerta de inactividad:</strong> Si una excepcion de servicio permanece activa por mas de 3 dias
        sin una fecha de fin definida, el sistema genera una alerta. Esto evita que excepciones queden
        abiertas indefinidamente por olvido.
      </div>

      <h3>Ejemplos de Excepciones de Servicio</h3>
      <ul>
        <li><strong>Eventos climaticos:</strong> Tormentas, huracanes, nevadas severas, inundaciones.</li>
        <li><strong>Cierres de vias:</strong> Obras en carretera, accidentes, bloqueos.</li>
        <li><strong>Dias festivos no planificados:</strong> Feriados decretados con poco aviso.</li>
        <li><strong>Emergencias operacionales:</strong> Problemas en centros de distribucion.</li>
        <li><strong>Situaciones de seguridad:</strong> Zonas con restricciones de acceso temporal.</li>
      </ul>

      <h3>Impacto en SLAs</h3>
      <p>
        Las excepciones de servicio tienen un impacto directo en la medicion de desempeno:
      </p>
      <ul>
        <li><strong>Justificacion de retrasos:</strong> Los envios afectados quedan justificados para retrasos en entrega.</li>
        <li><strong>Indicadores de rendimiento:</strong> Los reportes pueden filtrar o marcar los envios cubiertos por excepciones.</li>
        <li><strong>Historial de excepciones:</strong> Se mantiene un registro completo para auditorias de cumplimiento.</li>
      </ul>
    `,
    test: {
      questions: [
        {
          id: 'c8l5q1',
          question: 'Cual es el proposito principal de las excepciones de servicio?',
          options: [
            { id: 'a', text: 'Bloquear envios en zonas peligrosas', explanation: 'Las excepciones de servicio no bloquean envios. Su proposito es justificar retrasos y documentar por que no se cumplieron los SLAs debido a eventos externos.' },
            { id: 'b', text: 'Justificar retrasos y no cumplimiento de SLAs por eventos extraordinarios externos' },
            { id: 'c', text: 'Asignar drivers adicionales a rutas congestionadas', explanation: 'Las excepciones no gestionan asignacion de drivers. Sirven para justificar retrasos en entregas causados por eventos extraordinarios fuera del control operativo.' },
            { id: 'd', text: 'Calcular el costo extra de entregas demoradas', explanation: 'Las excepciones no calculan costos adicionales. Su funcion es documentar y justificar el incumplimiento de SLAs por eventos extraordinarios externos.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l5q2',
          question: 'Cual es la diferencia entre una excepcion publica y una privada?',
          options: [
            { id: 'a', text: 'La publica afecta mas rutas que la privada', explanation: 'La cantidad de rutas afectadas no depende de la visibilidad. La diferencia es quien puede ver la excepcion: la publica es visible para clientes y shippers, la privada solo internamente.' },
            { id: 'b', text: 'La publica es visible para clientes y shippers; la privada solo para el equipo interno' },
            { id: 'c', text: 'La publica requiere aprobacion del gerente; la privada no', explanation: 'No hay diferencia en el proceso de aprobacion. La distincion es de visibilidad: publica para todos incluyendo clientes, privada solo para el equipo interno.' },
            { id: 'd', text: 'La publica dura mas tiempo que la privada', explanation: 'La duracion no esta relacionada con la visibilidad. Ambos tipos pueden tener cualquier duracion. La diferencia es la audiencia: publica incluye clientes y shippers.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l5q3',
          question: 'Como se determinan los codigos postales afectados por una excepcion?',
          options: [
            { id: 'a', text: 'El operador los ingresa manualmente uno por uno', explanation: 'No es necesario ingresarlos manualmente. El operador selecciona las rutas afectadas y el sistema calcula automaticamente los codigos postales asociados a esas rutas.' },
            { id: 'b', text: 'Se calculan automaticamente a partir de las rutas seleccionadas' },
            { id: 'c', text: 'El sistema escanea todos los envios pendientes', explanation: 'El sistema no escanea envios para determinar los codigos postales. Los obtiene automaticamente consultando los codigos postales asociados a las rutas seleccionadas.' },
            { id: 'd', text: 'Se importan desde un archivo externo', explanation: 'No se requiere importar archivos. Los codigos postales se derivan automaticamente de las rutas que el operador selecciona como afectadas por el evento.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l5q4',
          question: 'Que sucede si una excepcion lleva mas de 3 dias activa sin fecha de fin?',
          options: [
            { id: 'a', text: 'Se cierra automaticamente', explanation: 'La excepcion no se cierra automaticamente por inactividad. El sistema genera una alerta para que un operador revise la situacion y decida si cerrarla manualmente.' },
            { id: 'b', text: 'Se elimina del sistema', explanation: 'Las excepciones no se eliminan. Tras 3 dias sin fecha de fin, el sistema genera una alerta de inactividad para evitar que queden abiertas indefinidamente por olvido.' },
            { id: 'c', text: 'El sistema genera una alerta de inactividad' },
            { id: 'd', text: 'Se convierte en una excepcion privada', explanation: 'La visibilidad de la excepcion no cambia automaticamente. Lo que ocurre tras 3 dias sin fecha de fin es que el sistema genera una alerta de inactividad.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c8l5q5',
          question: 'De cuantas formas puede cerrarse una excepcion de servicio?',
          options: [
            { id: 'a', text: 'Solo manualmente por un operador', explanation: 'El cierre manual es solo una de tres formas. Tambien puede cerrarse automaticamente por fecha de fin o generar una alerta por inactividad tras 3 dias sin fecha de fin.' },
            { id: 'b', text: 'Tres formas: cierre manual, cierre automatico por fecha de fin, y alerta por inactividad tras 3 dias' },
            { id: 'c', text: 'Solo automaticamente cuando no hay mas envios pendientes', explanation: 'El cierre no depende de la cantidad de envios pendientes. Las tres formas son: cierre manual, cierre automatico por fecha de fin y alerta por inactividad tras 3 dias.' },
            { id: 'd', text: 'Dos formas: manual y automatica por resolucion de todos los envios', explanation: 'No son dos formas ni depende de la resolucion de envios. Son tres mecanismos: cierre manual, cierre automatico por fecha de fin y alerta por inactividad.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l5q6',
          question: 'Que impacto tienen las excepciones de servicio en los indicadores de rendimiento?',
          options: [
            { id: 'a', text: 'Ningun impacto, los SLAs se miden igual', explanation: 'Las excepciones si impactan los indicadores. Los envios cubiertos por excepciones quedan justificados y los reportes pueden filtrar o marcar estos envios.' },
            { id: 'b', text: 'Los envios afectados quedan justificados y los reportes pueden filtrar o marcar estos envios' },
            { id: 'c', text: 'Se eliminan los envios afectados de los reportes', explanation: 'Los envios no se eliminan de los reportes. Los reportes pueden filtrar o marcar los envios cubiertos por excepciones, pero los datos siguen disponibles.' },
            { id: 'd', text: 'Se recalculan los SLAs eliminando los dias del evento', explanation: 'No se recalculan los SLAs eliminando dias. Lo que ocurre es que los envios afectados quedan justificados y marcados en los reportes para contextualizar los indicadores.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l5q7',
          question: 'Cual de los siguientes es un ejemplo de excepcion de servicio?',
          options: [
            { id: 'a', text: 'Un driver que llega tarde a su turno', explanation: 'La tardanza de un driver es un problema operativo interno, no un evento extraordinario externo que afecte rutas o zonas completas.' },
            { id: 'b', text: 'Un error de escaneo en el almacen', explanation: 'Un error de escaneo generaria una anomalia, no una excepcion de servicio. Las excepciones cubren eventos externos extraordinarios que afectan rutas.' },
            { id: 'c', text: 'Una tormenta severa que impide entregas en varias rutas' },
            { id: 'd', text: 'Un cliente que no esta en casa para recibir el envio', explanation: 'La ausencia de un cliente individual no es un evento extraordinario externo. Las excepciones cubren eventos que afectan multiples rutas o zonas geograficas.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c8l5q8',
          question: 'La fecha de fin de una excepcion de servicio es obligatoria?',
          options: [
            { id: 'a', text: 'Si, siempre es obligatoria', explanation: 'La fecha de fin es opcional al crear la excepcion. Sin embargo, si no se define, el sistema genera una alerta de inactividad tras 3 dias como mecanismo de control.' },
            { id: 'b', text: 'No, es opcional, pero si no se define se genera una alerta tras 3 dias' },
            { id: 'c', text: 'Solo es obligatoria para excepciones publicas', explanation: 'La obligatoriedad de la fecha de fin no depende de la visibilidad. Es opcional para todos los tipos, con una alerta de inactividad tras 3 dias si no se define.' },
            { id: 'd', text: 'Solo es obligatoria si afecta mas de 5 rutas', explanation: 'La cantidad de rutas afectadas no determina si la fecha de fin es obligatoria. Es siempre opcional, pero el sistema alerta tras 3 dias si no se define.' }
          ],
          correctOptionId: 'b'
        }
      ]
    }
  },
  {
    title: 'Modulos Adicionales',
    order: 6,
    content: `
      <h2>Modulos Adicionales</h2>
      <p>
        Ademas de los modulos principales del sistema, SyncFreight cuenta con una serie de modulos
        complementarios que cubren funcionalidades especificas de la operacion logistica. Esta leccion
        cubre los modulos de Clientes, Productos e Inventario, Ordenes, Promociones, Codigos Postales
        y Rutas, Jobs Asincronos, Notificaciones y URLs Cortas.
      </p>

      <h3>Modulo de Clientes</h3>
      <p>
        El modulo de clientes gestiona la informacion de los <strong>clientes finales</strong>
        (destinatarios de envios). Cada cliente pertenece a una organizacion.
      </p>

      <h4>Campos del Cliente</h4>
      <ul>
        <li><strong>Nombre</strong></li>
        <li><strong>Email:</strong> Unico por organizacion.</li>
        <li><strong>Telefono</strong></li>
        <li><strong>Direccion de envio</strong></li>
        <li><strong>Direccion de facturacion</strong></li>
        <li><strong>Tax ID:</strong> Identificador fiscal.</li>
        <li><strong>Horario de operacion</strong></li>
        <li><strong>Credito:</strong> Si esta habilitado, incluye dias de pago.</li>
        <li><strong>Documentos:</strong> Certificado de exencion fiscal, acuerdo firmado.</li>
      </ul>

      <h4>Verificacion de Direccion</h4>
      <p>
        El sistema utiliza <strong>Google Maps Geocoding API</strong> para verificar las direcciones de los clientes:
      </p>
      <ul>
        <li>Se obtienen las coordenadas geograficas de la direccion.</li>
        <li>Se determina el nivel de precision: <code>ROOFTOP</code> (exacto) o aproximado.</li>
        <li>Se genera una alerta si el codigo postal no coincide con la ubicacion.</li>
      </ul>

      <h4>Deteccion de Duplicados</h4>
      <p>
        Cuando dos clientes tienen las <strong>mismas coordenadas de geocodificacion</strong>,
        el sistema los marca como posibles duplicados. Esto permite detectar clientes registrados
        multiples veces con variaciones menores en la direccion.
      </p>

      <h4>Flujo de Aprobacion de Clientes</h4>
      <p>
        Los clientes siguen un flujo de aprobacion:
      </p>
      <ul>
        <li><strong>Creacion:</strong> El cliente se crea con estado <strong>pendiente</strong>.</li>
        <li><strong>Revision:</strong> Un supervisor revisa y aprueba el cliente.</li>
        <li><strong>Eliminacion:</strong> Solo clientes pendientes pueden eliminarse permanentemente (hard delete). Los clientes aprobados se desactivan (soft delete).</li>
      </ul>

      <h3>Modulo de Productos e Inventario</h3>

      <h4>Campos del Producto</h4>
      <table>
        <thead>
          <tr>
            <th>Campo</th>
            <th>Descripcion</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Nombre</strong></td>
            <td>Nombre descriptivo del producto</td>
          </tr>
          <tr>
            <td><strong>SKU</strong></td>
            <td>Codigo unico de identificacion</td>
          </tr>
          <tr>
            <td><strong>SKUs alternativos</strong></td>
            <td>Codigos adicionales para el mismo producto</td>
          </tr>
          <tr>
            <td><strong>Precio / Costo</strong></td>
            <td>Precio de venta y costo de adquisicion</td>
          </tr>
          <tr>
            <td><strong>Categoria</strong></td>
            <td>Clasificacion del producto</td>
          </tr>
          <tr>
            <td><strong>Peso y Dimensiones</strong></td>
            <td>Para calculo de envio y almacenamiento</td>
          </tr>
          <tr>
            <td><strong>Seguimiento por lote</strong></td>
            <td>Si el producto se rastrea por numero de lote</td>
          </tr>
          <tr>
            <td><strong>Dias de expiracion</strong></td>
            <td>Vida util del producto en dias</td>
          </tr>
        </tbody>
      </table>

      <h4>Seguimiento de Stock</h4>
      <p>
        Cada unidad fisica se rastrea <strong>individualmente</strong> con los siguientes datos:
      </p>
      <ul>
        <li><strong>Referencia interna:</strong> Barcode unico por nodo.</li>
        <li><strong>Nodo/Warehouse:</strong> Ubicacion fisica actual.</li>
        <li><strong>Numero de lote:</strong> Agrupacion por lote de produccion.</li>
        <li><strong>Fecha de expiracion:</strong> Calculada automaticamente segun los dias de expiracion del producto.</li>
      </ul>

      <h4>Bloqueo de Stock</h4>
      <p>El stock puede bloquearse de tres formas:</p>
      <table>
        <thead>
          <tr>
            <th>Tipo de Bloqueo</th>
            <th>Descripcion</th>
            <th>Comportamiento</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Temporal</strong></td>
            <td>Reserva a corto plazo</td>
            <td>Expira automaticamente despues de un periodo</td>
          </tr>
          <tr>
            <td><strong>Por orden</strong></td>
            <td>Reservado para una orden especifica</td>
            <td>Se libera al cancelar la orden</td>
          </tr>
          <tr>
            <td><strong>Merma (Waste)</strong></td>
            <td>Unidad inutilizable</td>
            <td>Requiere razon, fotos y comentarios. No se libera.</td>
          </tr>
        </tbody>
      </table>
      <p>
        Una unidad solo esta <strong>disponible</strong> si no tiene bloqueos activos y no esta marcada como merma.
      </p>

      <h4>Control de Expiracion</h4>
      <ul>
        <li><strong>Alertas de violacion FIFO:</strong> El sistema alerta si se despachan unidades mas nuevas antes que las mas antiguas.</li>
        <li><strong>Reportes exportables:</strong> Informes de unidades expiradas o proximas a expirar.</li>
        <li><strong>Consultas:</strong> Busqueda rapida de unidades por estado de expiracion.</li>
      </ul>

      <h3>Modulo de Ordenes</h3>

      <h4>Campos de la Orden</h4>
      <ul>
        <li><strong>Numero de orden:</strong> Auto-secuencial por organizacion.</li>
        <li><strong>Cliente:</strong> A quien pertenece la orden.</li>
        <li><strong>Detalle:</strong> Productos con cantidad, precio unitario y numeros de tracking.</li>
        <li><strong>Total:</strong> Monto total de la orden.</li>
        <li><strong>Tipo de pago:</strong> Efectivo o credito.</li>
        <li><strong>Promociones aplicadas:</strong> Snapshot inmutable de las promociones al momento de la orden.</li>
        <li><strong>Nodo:</strong> Desde que nodo se despacha.</li>
      </ul>

      <h4>Estados de la Orden</h4>
      <pre>PLACED -> DISPATCHED -> DELIVERED</pre>
      <p>
        Una orden puede cancelarse (<strong>CANCELLED</strong>) unicamente desde el estado <strong>PLACED</strong>.
        Una vez despachada, no se puede cancelar.
      </p>

      <h4>Relacion Orden - Envios</h4>
      <ul>
        <li><strong>Al crear:</strong> El stock se bloquea (reserva) para los productos de la orden.</li>
        <li><strong>Al despachar:</strong> Se generan envios (shipments) con numeros de tracking.</li>
        <li><strong>Al cancelar:</strong> El stock reservado se libera.</li>
      </ul>

      <div class="callout">
        <strong>Reglas importantes de ordenes:</strong>
        Solo ordenes en estado PLACED pueden cancelarse.
        No se permiten ordenes para clientes pendientes de aprobacion.
        Las promociones se guardan como snapshot inmutable (no cambian si la promocion se modifica despues).
        El sistema soporta checkout como invitado (guest checkout).
      </div>

      <h3>Modulo de Promociones</h3>

      <h4>Campos de una Promocion</h4>
      <ul>
        <li><strong>Nombre y codigo</strong></li>
        <li><strong>Descripcion y notas internas</strong></li>
        <li><strong>Prioridad:</strong> Mayor numero = evaluada primero.</li>
        <li><strong>Combinable:</strong> Si puede aplicarse junto con otras promociones.</li>
        <li><strong>Activa:</strong> Si esta habilitada o deshabilitada.</li>
      </ul>

      <h4>Condiciones de Elegibilidad (5 categorias, todas opcionales)</h4>
      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Criterios</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Producto</strong></td>
            <td>SKUs, categorias, marcas, SKUs excluidos</td>
          </tr>
          <tr>
            <td><strong>Cantidad</strong></td>
            <td>Minimo y maximo de unidades</td>
          </tr>
          <tr>
            <td><strong>Cliente</strong></td>
            <td>Tipos: nuevo, regular, VIP, mayorista; tags personalizados</td>
          </tr>
          <tr>
            <td><strong>Temporal</strong></td>
            <td>Rango de fechas, dias de la semana especificos, rango de horas</td>
          </tr>
          <tr>
            <td><strong>Compra</strong></td>
            <td>Subtotal minimo, metodos de pago</td>
          </tr>
        </tbody>
      </table>

      <h4>Tipos de Descuento</h4>
      <ul>
        <li><strong>Porcentaje:</strong> Descuento porcentual sobre el precio.</li>
        <li><strong>Monto fijo:</strong> Descuento de una cantidad fija.</li>
        <li><strong>Precio fijo:</strong> Se establece un precio especial.</li>
        <li><strong>Escalonado:</strong> Precios por volumen con brackets (ej: 1-10 unidades a $5, 11-50 a $4).</li>
      </ul>

      <h4>Modos de Aplicacion</h4>
      <ul>
        <li>Todas las unidades</li>
        <li>Cada N-esima unidad</li>
        <li>Primeras N unidades</li>
        <li>Ultimas N unidades</li>
        <li>Articulo mas barato</li>
      </ul>

      <h4>Combinabilidad</h4>
      <p>
        Las promociones <strong>combinables</strong> se acumulan entre si.
        Las <strong>no combinables</strong> funcionan diferente: solo se aplica la de mayor descuento
        y se detiene la evaluacion de las demas.
      </p>

      <h4>Evaluacion del Carrito</h4>
      <p>El proceso de evaluacion de promociones sigue estos pasos:</p>
      <ul>
        <li>1. Filtrar promociones activas que cumplan las condiciones.</li>
        <li>2. Ordenar por prioridad (mayor primero).</li>
        <li>3. Calcular descuento de cada una.</li>
        <li>4. Retornar por producto: precio original, descuento total, precio final y promociones aplicadas.</li>
        <li>5. Retornar resumen: subtotal, descuento total y total final.</li>
      </ul>

      <h3>Codigos Postales y Rutas</h3>

      <h4>Codigos Postales</h4>
      <p>
        Cada codigo postal tiene: <strong>5 caracteres unicos</strong>, coordenadas de latitud/longitud y un
        <strong>route code</strong> asignado.
      </p>

      <h4>Route Codes</h4>
      <p>
        Los route codes agrupan codigos postales que comparten la misma ruta de entrega. La configuracion
        de nodos define que route codes atiende cada nodo, por organizacion y tipo de despacho.
      </p>

      <h4>Flujo de Asignacion</h4>
      <ul>
        <li>1. Un envio llega con un codigo postal de destino.</li>
        <li>2. El sistema busca el codigo postal y obtiene su route code.</li>
        <li>3. El route code determina a que nodo de despacho corresponde.</li>
        <li>4. El nodo de despacho valida que el codigo postal coincida con sus rutas configuradas.</li>
      </ul>

      <h3>Jobs Asincronos</h3>
      <p>
        Los jobs asincronos permiten ejecutar <strong>operaciones masivas</strong> sin bloquear la interfaz:
      </p>
      <ul>
        <li>1. El operador sube un archivo CSV/XLSX.</li>
        <li>2. El sistema crea un Job y extrae las filas como Tasks individuales.</li>
        <li>3. Las tasks se envian a Google Cloud Tasks para ejecucion independiente.</li>
        <li>4. El operador puede verificar el progreso en cualquier momento.</li>
      </ul>

      <h4>Tipos de Operaciones Masivas</h4>
      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Operaciones</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Envios</strong></td>
            <td>Creacion masiva, actualizacion, forzar entrega/perdida, replicar</td>
          </tr>
          <tr>
            <td><strong>Codigos Postales</strong></td>
            <td>Actualizacion masiva</td>
          </tr>
          <tr>
            <td><strong>Vendors/Drivers</strong></td>
            <td>Asignar, calcular estadisticas</td>
          </tr>
          <tr>
            <td><strong>Facturacion</strong></td>
            <td>Calcular precios, generar facturas</td>
          </tr>
          <tr>
            <td><strong>Almacen</strong></td>
            <td>Escaneo de pallets, manejo de missorts</td>
          </tr>
          <tr>
            <td><strong>Issues</strong></td>
            <td>Auto-cierre de BLOCKED, creacion de NMI</td>
          </tr>
          <tr>
            <td><strong>Reportes</strong></td>
            <td>Generacion, envio masivo por email</td>
          </tr>
          <tr>
            <td><strong>Rutas Flex</strong></td>
            <td>Optimizacion de clustering</td>
          </tr>
        </tbody>
      </table>

      <h3>Notificaciones</h3>
      <p>
        El sistema de notificaciones utiliza <strong>Firebase Cloud Messaging (FCM)</strong>:
      </p>
      <ul>
        <li><strong>Directas al usuario:</strong> Se envian a todos los dispositivos registrados del usuario.</li>
        <li><strong>Por topic:</strong> Se envian a todos los suscriptores de un tema (broadcast).</li>
      </ul>
      <p>
        Cada usuario puede tener <strong>multiples dispositivos</strong> registrados (telefono, tablet, navegador),
        cada uno con su token de Firebase y plataforma. La suscripcion a topics se gestiona por dispositivo o plataforma.
      </p>

      <h3>URLs Cortas (Short URLs)</h3>
      <p>
        El sistema genera URLs cortas con las siguientes caracteristicas:
      </p>
      <ul>
        <li><strong>Codigo:</strong> 8 caracteres aleatorios.</li>
        <li><strong>Formato:</strong> <code>dominio/ly/{codigo}</code></li>
        <li><strong>Acceso publico:</strong> No requiere autenticacion.</li>
        <li><strong>Redireccion automatica:</strong> Al acceder, redirige a la URL de destino.</li>
      </ul>
      <p><strong>Usos principales:</strong></p>
      <ul>
        <li>Tracking publico de envios.</li>
        <li>Enlaces de issues NMI para autoservicio del cliente.</li>
        <li>URLs amigables para SMS.</li>
      </ul>
    `,
    test: {
      questions: [
        {
          id: 'c8l6q1',
          question: 'Que API utiliza el sistema para verificar las direcciones de los clientes?',
          options: [
            { id: 'a', text: 'OpenStreetMap API', explanation: 'El sistema no utiliza OpenStreetMap. La verificacion de direcciones se realiza mediante Google Maps Geocoding API para obtener coordenadas y nivel de precision.' },
            { id: 'b', text: 'Google Maps Geocoding API' },
            { id: 'c', text: 'Mapbox Directions API', explanation: 'Mapbox no es la API utilizada. El sistema usa Google Maps Geocoding API para verificar direcciones y determinar la precision de la geocodificacion.' },
            { id: 'd', text: 'HERE Location Services', explanation: 'HERE Location Services no es la API integrada. El sistema utiliza Google Maps Geocoding API para la verificacion de direcciones de clientes.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l6q2',
          question: 'Que ocurre con el stock cuando se cancela una orden?',
          options: [
            { id: 'a', text: 'Se marca como merma automaticamente', explanation: 'La merma es para unidades inutilizables. Al cancelar una orden, el stock reservado simplemente se libera y vuelve a estar disponible para otras ordenes.' },
            { id: 'b', text: 'El stock reservado se libera' },
            { id: 'c', text: 'Se transfiere a otro warehouse', explanation: 'Cancelar una orden no implica transferencia de stock entre warehouses. El stock reservado se libera en el mismo nodo donde estaba bloqueado.' },
            { id: 'd', text: 'Permanece bloqueado hasta revision manual', explanation: 'El stock no requiere revision manual tras una cancelacion. Se libera automaticamente al cancelar la orden, volviendo a estar disponible inmediatamente.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c8l6q3',
          question: 'Desde que estado se puede cancelar una orden?',
          options: [
            { id: 'a', text: 'Desde cualquier estado', explanation: 'No es posible cancelar desde cualquier estado. Una vez que la orden pasa a DISPATCHED, ya no se puede cancelar porque los envios ya fueron generados.' },
            { id: 'b', text: 'Solo desde DISPATCHED', explanation: 'Desde DISPATCHED ya no es posible cancelar porque los envios ya fueron generados con numeros de tracking. La cancelacion solo es posible desde PLACED.' },
            { id: 'c', text: 'Solo desde PLACED' },
            { id: 'd', text: 'Desde PLACED o DISPATCHED', explanation: 'Desde DISPATCHED ya no se puede cancelar. Solo las ordenes en estado PLACED, antes de ser despachadas, pueden cancelarse para liberar el stock reservado.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c8l6q6',
          question: 'Que tipos de bloqueo de stock existen?',
          options: [
            { id: 'a', text: 'Manual y automatico', explanation: 'La clasificacion no es por metodo de creacion. Los tres tipos de bloqueo son: temporal (expira automaticamente), por orden (reserva especifica) y merma (unidad inutilizable).' },
            { id: 'b', text: 'Temporal, por orden y merma (waste)' },
            { id: 'c', text: 'Por producto, por categoria y por warehouse', explanation: 'El bloqueo no se clasifica por nivel de agrupacion. Los tres tipos son: temporal, por orden y merma (waste), cada uno con un comportamiento distinto.' },
            { id: 'd', text: 'Parcial y total', explanation: 'No existe clasificacion de bloqueo parcial o total. Los tres tipos definidos en el sistema son: temporal, por orden y merma (waste).' }
          ],
          correctOptionId: 'b'
        }
      ]
    }
  }
];
