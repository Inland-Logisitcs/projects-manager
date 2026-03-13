export const course7Data = {
  title: 'Usuarios, Roles y Permisos',
  description: 'Domina el sistema RBAC: usuarios, invitacion, flex drivers, roles organizacionales, permisos granulares y autenticacion JWT.',
  order: 7,
  published: true,
  totalLessons: 5
};

export const course7Lessons = [
  {
    title: 'Usuarios y Propiedades',
    order: 1,
    content: `
      <h2>Usuarios y Propiedades</h2>
      <p>
        Cada usuario en SyncFreight es una entidad con multiples propiedades que definen su identidad,
        acceso y comportamiento dentro de la plataforma. Comprender estas propiedades es fundamental
        para la administracion correcta del sistema.
      </p>

      <h3>Propiedades del Usuario</h3>
      <p>A continuacion se detallan todas las propiedades que componen un usuario en el sistema:</p>
      <table>
        <thead>
          <tr>
            <th>Propiedad</th>
            <th>Tipo</th>
            <th>Descripcion</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>name</strong></td>
            <td>String</td>
            <td>Nombre del usuario.</td>
          </tr>
          <tr>
            <td><strong>surname</strong></td>
            <td>String</td>
            <td>Apellido del usuario.</td>
          </tr>
          <tr>
            <td><strong>email</strong></td>
            <td>String (unico)</td>
            <td>Correo electronico. Funciona como identificador unico en el sistema. No puede repetirse entre usuarios.</td>
          </tr>
          <tr>
            <td><strong>phone</strong></td>
            <td>String</td>
            <td>Numero de telefono del usuario.</td>
          </tr>
          <tr>
            <td><strong>address</strong></td>
            <td>String (opcional)</td>
            <td>Direccion fisica del usuario. Campo opcional.</td>
          </tr>
          <tr>
            <td><strong>organizations</strong></td>
            <td>Array</td>
            <td>Lista de organizaciones a las que pertenece el usuario. Un usuario puede pertenecer a multiples organizaciones.</td>
          </tr>
          <tr>
            <td><strong>lastOrg</strong></td>
            <td>String</td>
            <td>Organizacion actual en la que el usuario esta trabajando. Se selecciona al iniciar sesion.</td>
          </tr>
          <tr>
            <td><strong>nodes</strong></td>
            <td>Array</td>
            <td>Lista de nodos (warehouses) a los que el usuario tiene acceso dentro de su organizacion.</td>
          </tr>
          <tr>
            <td><strong>lastNode</strong></td>
            <td>String</td>
            <td>Nodo (warehouse) actual donde el usuario esta operando.</td>
          </tr>
          <tr>
            <td><strong>positions</strong></td>
            <td>Array</td>
            <td>Posiciones especiales que ocupa el usuario (por ejemplo: driver, mechanic).</td>
          </tr>
          <tr>
            <td><strong>roles</strong></td>
            <td>Array</td>
            <td>Roles asignados al usuario que determinan sus permisos en el sistema.</td>
          </tr>
          <tr>
            <td><strong>enabled</strong></td>
            <td>Boolean</td>
            <td>Indica si el usuario puede iniciar sesion. Si es <code>false</code>, el acceso esta bloqueado pero la cuenta se conserva.</td>
          </tr>
          <tr>
            <td><strong>verified</strong></td>
            <td>Boolean</td>
            <td>Indica si el usuario ha verificado su email y establecido su contraseña.</td>
          </tr>
        </tbody>
      </table>

      <h3>Posiciones Especiales</h3>
      <p>
        Las posiciones representan funciones operativas especificas dentro de la organizacion.
        Cuando se asigna una posicion a un usuario, el sistema automaticamente le asigna el rol correspondiente.
      </p>
      <table>
        <thead>
          <tr>
            <th>Posicion</th>
            <th>Funcion</th>
            <th>Rol Auto-asignado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>driver</strong></td>
            <td>Conductor de reparto. Realiza entregas de ultima milla, captura pruebas de entrega y utiliza la app movil SyncPod.</td>
            <td>Driver</td>
          </tr>
          <tr>
            <td><strong>mechanic</strong></td>
            <td>Mantenimiento de vehiculos. Responsable del cuidado y reparacion de la flota vehicular.</td>
            <td>Mechanic</td>
          </tr>
        </tbody>
      </table>

      <div class="callout">
        <strong>Concepto clave:</strong> Las posiciones y los roles estan vinculados. Al asignar la posicion
        <code>driver</code> a un usuario, el sistema le otorga automaticamente el rol "Driver" con todos
        sus permisos asociados. No es necesario asignar el rol manualmente.
      </div>

      <h3>Nodos de Usuario (User Nodes)</h3>
      <p>
        Cada usuario tiene acceso a uno o mas nodos (warehouses) dentro de su organizacion. El nodo actual
        del usuario (<code>lastNode</code>) tiene un impacto directo en varias operaciones del sistema:
      </p>
      <ul>
        <li><strong>Bulk scan de warehouse:</strong> Determina en que warehouse se registran los escaneos masivos de paquetes.</li>
        <li><strong>Filtrado de envios:</strong> Los envios se filtran automaticamente segun la ubicacion (nodo) del usuario.</li>
        <li><strong>Registro de cambios de estado:</strong> Cuando un usuario cambia el estado de un envio, el sistema registra desde que nodo se realizo el cambio.</li>
      </ul>

      <div class="callout warning">
        <strong>Importante:</strong> Si un usuario no tiene asignado ningun nodo, no podra realizar operaciones
        de warehouse como escaneo masivo. Asegurate de asignar al menos un nodo a cada usuario que necesite
        operar en un almacen.
      </div>

      <h3>Multi-organizacion</h3>
      <p>
        SyncFreight permite que un mismo usuario pertenezca a multiples organizaciones simultaneamente.
        Al iniciar sesion, el usuario selecciona en que organizacion desea trabajar. Este modelo habilita
        varios escenarios:
      </p>
      <ul>
        <li><strong>Administrador de subsidiarias:</strong> Un administrador puede gestionar varias empresas filiales desde una sola cuenta.</li>
        <li><strong>Driver para multiples carriers:</strong> Un conductor puede realizar entregas para diferentes empresas de transporte.</li>
        <li><strong>Personal compartido:</strong> Empleados que prestan servicios a mas de una organizacion logistica.</li>
      </ul>

      <h3>Cambio de Organizacion</h3>
      <p>
        Cuando un usuario cambia de organizacion activa, el sistema recalcula completamente sus roles y permisos.
        Solo se aplican los roles correspondientes a la organizacion actual, ademas de los roles globales.
      </p>
      <div class="callout">
        <strong>Concepto clave:</strong> Los permisos de un usuario son dinamicos y dependen de la organizacion
        en la que esta trabajando actualmente. Un usuario puede ser administrador en una organizacion y
        tener solo permisos de operador en otra.
      </div>
    `,
    test: {
      questions: [
        {
          id: 'c7l1q1',
          question: 'Que propiedad del usuario funciona como identificador unico en el sistema?',
          options: [
            { id: 'a', text: 'email' },
            { id: 'b', text: 'name', explanation: 'El nombre no es un identificador unico ya que multiples usuarios pueden compartir el mismo nombre sin restriccion alguna.' },
            { id: 'c', text: 'phone', explanation: 'El telefono no funciona como identificador unico en el sistema; es un campo informativo que no tiene restriccion de unicidad.' },
            { id: 'd', text: 'lastOrg', explanation: 'lastOrg almacena la ultima organizacion del usuario, no es un identificador unico ya que muchos usuarios pueden pertenecer a la misma organizacion.' }
          ],
          correctOptionId: 'a'
        },
        {
          id: 'c7l1q2',
          question: 'Que ocurre automaticamente cuando se asigna la posicion "driver" a un usuario?',
          options: [
            { id: 'a', text: 'Se le asigna acceso a todos los warehouses', explanation: 'Asignar la posicion driver no otorga acceso a warehouses; el acceso a warehouses se gestiona de forma independiente.' },
            { id: 'b', text: 'Se le auto-asigna el rol "Driver" con sus permisos correspondientes' },
            { id: 'c', text: 'Se le envia un email de bienvenida', explanation: 'El envio de email de bienvenida ocurre durante el proceso de invitacion, no al asignar una posicion especifica.' },
            { id: 'd', text: 'Se habilita automaticamente su cuenta', explanation: 'La habilitacion de la cuenta se gestiona con la propiedad "enabled" y no esta vinculada a la asignacion de posiciones.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c7l1q3',
          question: 'Para que se utiliza la propiedad "lastNode" del usuario?',
          options: [
            { id: 'b', text: 'Para determinar el nodo donde el usuario opera actualmente' },
            { id: 'c', text: 'Para guardar el ultimo nodo donde se creo un envio', explanation: 'lastNode no registra donde se creo un envio; es una propiedad del usuario que define su warehouse operativo actual.' },
            { id: 'd', text: 'Para definir el nodo por defecto de la organizacion', explanation: 'lastNode es una propiedad individual de cada usuario, no una configuracion a nivel de organizacion.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c7l1q4',
          question: 'Que sucede con los roles y permisos cuando un usuario cambia de organizacion?',
          options: [
            { id: 'a', text: 'Se mantienen exactamente los mismos roles y permisos', explanation: 'Los roles organizacionales son especificos de cada organizacion, por lo que no se mantienen al cambiar; solo los globales persisten.' },
            { id: 'b', text: 'Se eliminan todos los roles del usuario', explanation: 'No se eliminan todos los roles; los roles globales se mantienen activos independientemente de la organizacion.' },
            { id: 'c', text: 'Se recalculan: solo se aplican los roles de la organizacion actual mas los roles globales' },
            { id: 'd', text: 'Se duplican los roles de la organizacion anterior', explanation: 'Los roles de la organizacion anterior no se duplican ni se transfieren; cada organizacion tiene sus propios roles asignados.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c7l1q5',
          question: 'Cual de los siguientes NO es un escenario habilitado por el modelo multi-organizacion?',
          options: [
            { id: 'a', text: 'Un administrador gestionando varias subsidiarias', explanation: 'Este si es un escenario valido; el modelo multi-organizacion permite que un administrador gestione multiples subsidiarias.' },
            { id: 'b', text: 'Un driver realizando entregas para multiples carriers', explanation: 'Este si es un escenario valido; un driver puede pertenecer a multiples organizaciones y realizar entregas para distintos carriers.' },
            { id: 'c', text: 'Un usuario registrandose a si mismo sin invitacion' },
            { id: 'd', text: 'Personal compartido entre varias organizaciones logisticas', explanation: 'Este si es un escenario valido; el modelo permite que el personal sea compartido entre varias organizaciones logisticas.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c7l1q6',
          question: 'Que indica la propiedad "enabled" de un usuario?',
          options: [
            { id: 'a', text: 'Si el usuario ha verificado su email', explanation: 'La verificacion de email se controla con la propiedad "verified", no con "enabled".' },
            { id: 'b', text: 'Si el usuario puede iniciar sesion en el sistema' },
            { id: 'c', text: 'Si el usuario tiene al menos un rol asignado', explanation: 'La asignacion de roles es independiente de "enabled"; un usuario puede estar habilitado sin roles o tener roles estando deshabilitado.' },
            { id: 'd', text: 'Si el usuario pertenece a alguna organizacion', explanation: 'La pertenencia a organizaciones se gestiona con las propiedades de organizacion del usuario, no con "enabled".' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c7l1q7',
          question: 'Cuales son las dos posiciones especiales disponibles en SyncFreight?',
          options: [
            { id: 'a', text: 'admin y operator', explanation: 'Admin y operator no son posiciones especiales del sistema; no activan auto-asignacion de roles.' },
            { id: 'b', text: 'driver y mechanic' },
            { id: 'c', text: 'manager y supervisor', explanation: 'Manager y supervisor no son posiciones especiales reconocidas por el sistema de auto-asignacion de roles.' },
            { id: 'd', text: 'warehouse y dispatcher', explanation: 'Warehouse y dispatcher no son posiciones especiales; no existen como posiciones que activen roles automaticos.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c7l1q8',
          question: 'Un usuario con "enabled: true" y "verified: false", que puede hacer?',
          options: [
            { id: 'a', text: 'Puede iniciar sesion normalmente con todas las funciones', explanation: 'No puede iniciar sesion normalmente porque "verified: false" indica que aun no ha completado la verificacion de email ni establecido contraseña.' },
            { id: 'b', text: 'No puede hacer nada, la cuenta esta completamente bloqueada', explanation: 'La cuenta no esta bloqueada; "enabled: true" indica que esta activa. Simplemente falta completar el proceso de verificacion.' },
            { id: 'c', text: 'Su cuenta esta habilitada pero aun no ha verificado su email ni establecido contraseña' },
            { id: 'd', text: 'Puede ver el sistema en modo lectura solamente', explanation: 'No existe un modo de lectura en SyncFreight; sin verificar el email y establecer contraseña, el usuario no puede acceder al sistema.' }
          ],
          correctOptionId: 'c'
        }
      ]
    }
  },
  {
    title: 'Invitacion, Registro y Gestion',
    order: 2,
    content: `
      <h2>Invitacion, Registro y Gestion de Usuarios</h2>
      <p>
        En SyncFreight, los usuarios no pueden auto-registrarse. Todo nuevo usuario debe ser creado
        e invitado por un administrador. Este modelo garantiza un control total sobre quien accede
        al sistema y con que permisos.
      </p>

      <h3>Flujo de Invitacion</h3>
      <p>El proceso de creacion e invitacion de un nuevo usuario sigue estos pasos:</p>
      <ol>
        <li><strong>Paso 1 - Creacion por el admin:</strong> El administrador crea el usuario proporcionando: nombre, email, organizacion, roles y posiciones.</li>
        <li><strong>Paso 2 - Estado inicial:</strong> El sistema crea al usuario con estado <code>enabled: true</code> pero <code>verified: false</code>. En este punto el usuario no tiene contraseña.</li>
        <li><strong>Paso 3 - Generacion de token:</strong> Se genera un token de bienvenida con una validez de 24 horas.</li>
        <li><strong>Paso 4 - Envio de email:</strong> El sistema envia un email de bienvenida con un enlace que contiene el token.</li>
        <li><strong>Paso 5 - Activacion:</strong> El usuario hace clic en el enlace, establece su contraseña y puede iniciar sesion.</li>
      </ol>

      <div class="callout">
        <strong>Concepto clave:</strong> El flujo de invitacion asegura que solo personas autorizadas puedan
        acceder al sistema. El token de bienvenida tiene una vigencia de 24 horas; si expira, el
        administrador debe generar uno nuevo.
      </div>

      <h3>Requisitos de contraseña</h3>
      <p>
        Las contraseñas en SyncFreight deben cumplir requisitos estrictos de seguridad para proteger
        las cuentas de usuario:
      </p>
      <table>
        <thead>
          <tr>
            <th>Requisito</th>
            <th>Detalle</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Longitud minima</strong></td>
            <td>8 caracteres</td>
          </tr>
          <tr>
            <td><strong>Longitud maxima</strong></td>
            <td>100 caracteres</td>
          </tr>
          <tr>
            <td><strong>Mayusculas</strong></td>
            <td>Debe incluir al menos una letra mayuscula</td>
          </tr>
          <tr>
            <td><strong>Minusculas</strong></td>
            <td>Debe incluir al menos una letra minuscula</td>
          </tr>
          <tr>
            <td><strong>Numeros</strong></td>
            <td>Debe incluir al menos un digito numerico</td>
          </tr>
          <tr>
            <td><strong>Simbolos</strong></td>
            <td>Debe incluir al menos un caracter especial</td>
          </tr>
          <tr>
            <td><strong>Espacios</strong></td>
            <td>No se permiten espacios en blanco</td>
          </tr>
        </tbody>
      </table>

      <h3>Recuperacion de contraseña</h3>
      <p>El proceso de restablecimiento de contraseña sigue un flujo seguro:</p>
      <ol>
        <li><strong>Solicitud:</strong> El usuario solicita el restablecimiento de contraseña desde la pantalla de login.</li>
        <li><strong>Generacion de token:</strong> El sistema genera un token de restablecimiento con validez de 24 horas.</li>
        <li><strong>Email de restablecimiento:</strong> Se envia un email con un enlace seguro que contiene el token.</li>
        <li><strong>Nueva contraseña:</strong> El usuario accede al enlace y establece una nueva contraseña que cumpla los requisitos.</li>
        <li><strong>Invalidacion del token:</strong> Una vez utilizado, el token se invalida automaticamente y no puede reutilizarse.</li>
      </ol>

      <div class="callout warning">
        <strong>Importante:</strong> Los tokens de restablecimiento son de un solo uso. Una vez que el usuario
        establece su nueva contraseña, el token queda invalidado. Si el token expira sin ser utilizado
        (despues de 24 horas), el usuario debe solicitar uno nuevo.
      </div>

      <h3>Habilitar y Deshabilitar Usuarios</h3>
      <p>
        Los administradores tienen la capacidad de habilitar o deshabilitar usuarios de forma individual
        o masiva (en bulk). Un usuario deshabilitado no puede iniciar sesion, pero su cuenta y toda
        su informacion se conservan intactas en el sistema.
      </p>

      <h3>Casos de Uso para Deshabilitar Usuarios</h3>
      <ul>
        <li><strong>Ausencia temporal:</strong> Un empleado en licencia o vacaciones prolongadas. Se deshabilita la cuenta como medida de seguridad y se reactiva a su regreso.</li>
        <li><strong>Drivers estacionales inactivos:</strong> Conductores que solo trabajan en temporadas de alta demanda. Se deshabilitan fuera de temporada para evitar accesos no autorizados.</li>
        <li><strong>Bloqueo preventivo:</strong> Ante sospecha de uso indebido o compromiso de credenciales, se deshabilita la cuenta inmediatamente mientras se investiga.</li>
      </ul>

      <div class="callout">
        <strong>Concepto clave:</strong> Deshabilitar un usuario es diferente a eliminarlo. La cuenta
        deshabilitada conserva todos sus datos, roles, historial y configuracion. Al reactivarla,
        el usuario retoma exactamente donde dejo, sin necesidad de reconfigurar nada.
      </div>
    `,
    test: {
      questions: [
        {
          id: 'c7l2q1',
          question: 'Pueden los usuarios auto-registrarse en SyncFreight?',
          options: [
            { id: 'a', text: 'Si, cualquier persona puede crear su cuenta desde la pagina de registro', explanation: 'No existe una pagina de registro publico en SyncFreight; el sistema no permite auto-registro para mantener el control de acceso.' },
            { id: 'b', text: 'No, todo usuario debe ser creado e invitado por un administrador' },
            { id: 'c', text: 'Si, pero necesitan un codigo de invitacion publico', explanation: 'No existen codigos de invitacion publicos; la invitacion es un proceso privado gestionado individualmente por un administrador.' },
            { id: 'd', text: 'Solo los drivers pueden auto-registrarse', explanation: 'Los drivers regulares tampoco pueden auto-registrarse; solo los flex drivers tienen un proceso de solicitud, pero aun requieren aprobacion de un administrador.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c7l2q2',
          question: 'Cual es la vigencia del token de bienvenida enviado al nuevo usuario?',
          options: [
            { id: 'a', text: '1 hora', explanation: '1 hora seria un plazo demasiado corto que no daria tiempo suficiente al usuario para completar el registro.' },
            { id: 'b', text: '12 horas', explanation: '12 horas no es la vigencia correcta del token de bienvenida; el plazo real es mayor para dar margen al usuario.' },
            { id: 'c', text: '24 horas' },
            { id: 'd', text: '48 horas', explanation: '48 horas excede la vigencia real del token; un plazo tan largo aumentaria el riesgo de seguridad si el enlace es interceptado.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c7l2q3',
          question: 'Cual es el estado inicial de un usuario recien creado por un administrador?',
          options: [
            { id: 'a', text: 'enabled: false, verified: false', explanation: 'La cuenta se crea habilitada (enabled: true) para que pueda completar el registro; no tendria sentido crearla deshabilitada desde el inicio.' },
            { id: 'b', text: 'enabled: true, verified: true', explanation: 'El usuario no puede estar verificado al crearse porque aun no ha completado la verificacion de email ni establecido su contraseña.' },
            { id: 'c', text: 'enabled: true, verified: false' },
            { id: 'd', text: 'enabled: false, verified: true', explanation: 'No es posible que un usuario este verificado pero deshabilitado al crearse, ya que la verificacion requiere que el usuario complete un proceso posterior.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c7l2q4',
          question: 'Cual de los siguientes NO es un requisito de contraseña en SyncFreight?',
          options: [
            { id: 'a', text: 'Incluir al menos una letra mayuscula', explanation: 'Las letras mayusculas si son un requisito de contraseña en SyncFreight para garantizar complejidad minima.' },
            { id: 'b', text: 'Tener un minimo de 8 caracteres', explanation: 'El minimo de 8 caracteres si es un requisito obligatorio de contraseña en el sistema.' },
            { id: 'c', text: 'Incluir al menos un espacio en blanco' },
            { id: 'd', text: 'Incluir al menos un simbolo especial', explanation: 'Los simbolos especiales si son un requisito de contraseña en SyncFreight como parte de la politica de seguridad.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c7l2q5',
          question: 'Que ocurre con el token de restablecimiento de contraseña una vez utilizado?',
          options: [
            { id: 'a', text: 'Se puede reutilizar durante las proximas 24 horas', explanation: 'Permitir reutilizar un token de restablecimiento seria un riesgo de seguridad; los tokens son de un solo uso por diseno.' },
            { id: 'b', text: 'Se invalida automaticamente y no puede reutilizarse' },
            { id: 'c', text: 'Se mantiene activo indefinidamente', explanation: 'Un token activo indefinidamente representaria una vulnerabilidad grave; podria ser usado por terceros en cualquier momento.' },
            { id: 'd', text: 'Se envia automaticamente un nuevo token', explanation: 'No se genera un nuevo token automaticamente despues de usar uno; el usuario debe solicitar explicitamente un nuevo restablecimiento si lo necesita.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c7l2q6',
          question: 'Que sucede con la informacion de un usuario cuando se deshabilita su cuenta?',
          options: [
            { id: 'a', text: 'Se elimina permanentemente del sistema', explanation: 'Deshabilitar no elimina nada; es una accion reversible que solo impide el acceso, a diferencia de la eliminacion permanente.' },
            { id: 'b', text: 'Se archiva en una base de datos separada', explanation: 'Los datos no se mueven a otra base de datos; permanecen en su ubicacion original, simplemente el acceso queda bloqueado.' },
            { id: 'c', text: 'Se conserva intacta; la cuenta puede reactivarse sin perder datos' },
            { id: 'd', text: 'Se eliminan los roles pero se conservan los datos personales', explanation: 'Deshabilitar no modifica ninguna informacion del usuario, incluyendo los roles; todo se conserva intacto.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c7l2q7',
          question: 'En que paso del flujo de invitacion el usuario establece su contraseña?',
          options: [
            { id: 'a', text: 'En el paso 1, cuando el admin crea la cuenta', explanation: 'En el paso 1 el administrador solo ingresa los datos basicos del usuario; la contraseña la establece el propio usuario mas adelante.' },
            { id: 'b', text: 'En el paso 3, al generar el token', explanation: 'En el paso 3 el sistema genera el token de bienvenida; este token se envia por email y no implica establecer contraseña.' },
            { id: 'c', text: 'En el paso 5, al hacer clic en el enlace del email' },
            { id: 'd', text: 'En el paso 2, cuando el sistema crea el usuario', explanation: 'En el paso 2 el sistema crea el registro del usuario automaticamente; la contraseña no se establece en este paso automatizado.' }
          ],
          correctOptionId: 'c'
        },
      ]
    }
  },
  {
    title: 'Flex Drivers',
    order: 3,
    content: `
      <h2>Flex Drivers</h2>
      <p>
        Los Flex Drivers son conductores independientes que se registran para realizar entregas bajo
        demanda a traves de la plataforma SyncFlex. A diferencia de los drivers regulares que son
        invitados por un administrador, los flex drivers siguen un proceso de registro y aprobacion
        especifico.
      </p>

      <h3>Registro de Flex Drivers</h3>
      <p>
        El proceso de registro de un flex driver requiere que el candidato proporcione informacion
        detallada sobre su disponibilidad y vehiculo:
      </p>
      <table>
        <thead>
          <tr>
            <th>Campo</th>
            <th>Descripcion</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Codigo postal</strong></td>
            <td>Zona geografica donde el driver puede operar y realizar entregas.</td>
          </tr>
          <tr>
            <td><strong>Dias disponibles</strong></td>
            <td>Dias de la semana en los que el driver esta disponible para trabajar.</td>
          </tr>
          <tr>
            <td><strong>Horarios preferidos</strong></td>
            <td>Franjas horarias en las que el driver prefiere realizar entregas.</td>
          </tr>
          <tr>
            <td><strong>Horas por semana</strong></td>
            <td>Cantidad de horas semanales que el driver esta dispuesto a dedicar.</td>
          </tr>
          <tr>
            <td><strong>Informacion del vehiculo</strong></td>
            <td>Detalles del vehiculo: año, marca, modelo y tipo de combustible.</td>
          </tr>
        </tbody>
      </table>

      <h3>Proceso de Aprobacion</h3>
      <p>
        Una vez completado el registro, el candidato pasa por un proceso de revision antes de poder
        operar en la plataforma:
      </p>
      <ol>
        <li>
          <strong>Revision por administrador:</strong> Un administrador con el permiso
          <code>approve_flex_users</code> revisa la solicitud del candidato, evaluando su zona de
          cobertura, disponibilidad y datos del vehiculo.
        </li>
        <li>
          <strong>Aprobacion:</strong> Si el candidato es aprobado, ocurren dos acciones automaticas:
          <ul>
            <li>El driver se agrega a la organizacion <strong>SyncFlex</strong> como miembro activo.</li>
            <li>Se le envia un <strong>email de confirmacion</strong> con instrucciones para comenzar a operar.</li>
          </ul>
        </li>
        <li>
          <strong>Rechazo:</strong> Si el candidato es rechazado:
          <ul>
            <li>Se registra el <strong>motivo del rechazo</strong> en el sistema.</li>
            <li>Los motivos se <strong>acumulan</strong> si el candidato vuelve a postularse y es rechazado nuevamente.</li>
          </ul>
        </li>
      </ol>

      <div class="callout">
        <strong>Concepto clave:</strong> Solo los administradores con el permiso
        <code>approve_flex_users</code> pueden aprobar o rechazar solicitudes de flex drivers.
        Este permiso es independiente de otros permisos de gestion de usuarios.
      </div>

      <h3>Acceso Limitado de Flex Drivers</h3>
      <p>
        Los flex drivers tienen un acceso deliberadamente restringido a la plataforma. Solo pueden
        realizar un conjunto limitado de acciones:
      </p>
      <table>
        <thead>
          <tr>
            <th>Accion Permitida</th>
            <th>Descripcion</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Ver rutas flex disponibles</strong></td>
            <td>Pueden consultar las rutas de entrega disponibles para tomar en su zona.</td>
          </tr>
          <tr>
            <td><strong>Aceptar rutas flex</strong></td>
            <td>Pueden aceptar rutas disponibles y comprometerse a realizar las entregas.</td>
          </tr>
          <tr>
            <td><strong>Ver rutas completadas y ganancias</strong></td>
            <td>Tienen acceso al historial de rutas realizadas y el detalle de sus ganancias.</td>
          </tr>
          <tr>
            <td><strong>Actualizar perfil y vehiculo</strong></td>
            <td>Pueden modificar su informacion personal y los datos de su vehiculo.</td>
          </tr>
        </tbody>
      </table>

      <div class="callout warning">
        <strong>Importante:</strong> Los flex drivers NO pueden acceder a funcionalidades del sistema
        como gestion de envios, operaciones de warehouse, administracion de usuarios ni ninguna
        otra funcion fuera de las cuatro listadas. Este acceso limitado protege la seguridad
        de la informacion de la organizacion.
      </div>

      <h3>Diferencias entre Drivers Regulares y Flex Drivers</h3>
      <table>
        <thead>
          <tr>
            <th>Aspecto</th>
            <th>Driver Regular</th>
            <th>Flex Driver</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Registro</strong></td>
            <td>Invitado por un administrador</td>
            <td>Se registra voluntariamente y pasa por aprobacion</td>
          </tr>
          <tr>
            <td><strong>Organizacion</strong></td>
            <td>Pertenece a la organizacion que lo invito</td>
            <td>Se agrega a la organizacion SyncFlex</td>
          </tr>
          <tr>
            <td><strong>Acceso</strong></td>
            <td>Permisos segun rol asignado</td>
            <td>Acceso limitado a rutas flex, ganancias y perfil</td>
          </tr>
          <tr>
            <td><strong>Rutas</strong></td>
            <td>Rutas asignadas por dispatcher</td>
            <td>Selecciona rutas disponibles voluntariamente</td>
          </tr>
          <tr>
            <td><strong>Vehiculo</strong></td>
            <td>Puede usar vehiculo de la empresa</td>
            <td>Usa su propio vehiculo (datos requeridos en registro)</td>
          </tr>
        </tbody>
      </table>
    `,
    test: {
      questions: [
        {
          id: 'c7l3q1',
          question: 'Que informacion del vehiculo debe proporcionar un flex driver al registrarse?',
          options: [
            { id: 'a', text: 'Solo la marca del vehiculo', explanation: 'La marca sola es insuficiente; el registro requiere informacion mas completa incluyendo año, modelo y tipo de combustible.' },
            { id: 'b', text: 'Año, marca, modelo y tipo de combustible' },
            { id: 'c', text: 'Numero de placa y seguro vigente', explanation: 'El numero de placa y seguro no se solicitan en el registro de flex driver; los datos requeridos son las caracteristicas del vehiculo.' },
            { id: 'd', text: 'Kilometraje y fecha de ultima revision', explanation: 'El kilometraje y las revisiones no forman parte del formulario de registro de flex driver.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c7l3q3',
          question: 'A que organizacion se agrega un flex driver cuando es aprobado?',
          options: [
            { id: 'a', text: 'A la organizacion del administrador que lo aprobo', explanation: 'Los flex drivers no se agregan a la organizacion del administrador; existe una organizacion dedicada especificamente para conductores independientes.' },
            { id: 'b', text: 'A la organizacion SyncFlex' },
            { id: 'c', text: 'A una organizacion temporal de prueba', explanation: 'No existe un concepto de organizacion temporal de prueba en SyncFreight; los flex drivers son asignados directamente a una organizacion permanente.' },
            { id: 'd', text: 'El flex driver elige su organizacion', explanation: 'Los flex drivers no eligen su organizacion; la asignacion es automatica al ser aprobados.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c7l3q4',
          question: 'Que sucede cuando un flex driver es rechazado y vuelve a postularse?',
          options: [
            { id: 'a', text: 'Su solicitud anterior se elimina y empieza de cero', explanation: 'El sistema no elimina solicitudes anteriores; conserva el historial completo para que los administradores tengan contexto al evaluar nuevas solicitudes.' },
            { id: 'b', text: 'No puede volver a postularse nunca', explanation: 'El rechazo no es permanente; los flex drivers pueden volver a postularse despues de ser rechazados.' },
            { id: 'c', text: 'Los motivos de rechazo se acumulan en su registro' },
            { id: 'd', text: 'Se le aprueba automaticamente en el segundo intento', explanation: 'No existe aprobacion automatica; cada solicitud es evaluada individualmente por un administrador con el permiso correspondiente.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c7l3q5',
          question: 'Cual de las siguientes acciones NO puede realizar un flex driver?',
          options: [
            { id: 'a', text: 'Ver rutas flex disponibles', explanation: 'Ver rutas flex disponibles si es una accion permitida; es la forma principal en que los flex drivers seleccionan sus entregas.' },
            { id: 'b', text: 'Gestionar envios en el warehouse' },
            { id: 'c', text: 'Ver sus rutas completadas y ganancias', explanation: 'Los flex drivers si pueden ver sus rutas completadas y ganancias como parte de su funcionalidad basica.' },
            { id: 'd', text: 'Actualizar su perfil y datos del vehiculo', explanation: 'Los flex drivers si pueden actualizar su perfil y datos del vehiculo desde su cuenta.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c7l3q6',
          question: 'Como obtiene sus rutas un flex driver comparado con un driver regular?',
          options: [
            { id: 'a', text: 'Ambos reciben rutas asignadas por un dispatcher', explanation: 'Solo el driver regular recibe rutas asignadas por un dispatcher; el flex driver tiene autonomia para elegir sus rutas.' },
            { id: 'b', text: 'El flex driver selecciona rutas disponibles voluntariamente, el regular las recibe asignadas' },
            { id: 'c', text: 'Ambos seleccionan rutas voluntariamente', explanation: 'El driver regular no selecciona rutas voluntariamente; sus rutas son asignadas por un dispatcher.' },
            { id: 'd', text: 'El flex driver recibe rutas asignadas, el regular las selecciona', explanation: 'Es al reves: el flex driver es quien selecciona voluntariamente y el regular es quien recibe rutas asignadas.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c7l3q7',
          question: 'Que dato de disponibilidad NO se solicita en el registro de un flex driver?',
          options: [
            { id: 'a', text: 'Dias disponibles de la semana', explanation: 'Los dias disponibles si se solicitan en el registro para saber cuando puede trabajar el flex driver.' },
            { id: 'b', text: 'Horarios preferidos', explanation: 'Los horarios preferidos si se solicitan para coordinar mejor la asignacion de rutas disponibles.' },
            { id: 'c', text: 'Salario esperado por hora' },
            { id: 'd', text: 'Horas por semana', explanation: 'Las horas por semana si se solicitan como parte de la informacion de disponibilidad del flex driver.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c7l3q8',
          question: 'Que acciones automaticas ocurren cuando un flex driver es aprobado?',
          options: [
            { id: 'a', text: 'Se crea una cuenta nueva y se le asignan rutas inmediatamente', explanation: 'No se asignan rutas inmediatamente al aprobar; el flex driver debe seleccionar voluntariamente sus rutas una vez activo.' },
            { id: 'b', text: 'Se agrega a la organizacion SyncFlex y se le envia un email de confirmacion' },
            { id: 'c', text: 'Se le asigna un vehiculo de la empresa y un warehouse base', explanation: 'Los flex drivers usan su propio vehiculo y no operan desde un warehouse; no se les asignan recursos de la empresa.' },
            { id: 'd', text: 'Se le otorgan permisos de administrador temporalmente', explanation: 'Los flex drivers reciben permisos limitados de conductor, no permisos de administrador en ningun caso.' }
          ],
          correctOptionId: 'b'
        }
      ]
    }
  },
  {
    title: 'Roles y Permisos',
    order: 4,
    content: `
      <h2>Roles y Permisos</h2>
      <p>
        SyncFreight implementa un sistema de control de acceso basado en roles (RBAC - Role-Based
        Access Control). Los roles agrupan conjuntos de permisos y se asignan a los usuarios para
        determinar que acciones pueden realizar y que informacion pueden ver en la plataforma.
      </p>

      <h3>Propiedades de un Rol</h3>
      <table>
        <thead>
          <tr>
            <th>Propiedad</th>
            <th>Descripcion</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>name</strong></td>
            <td>Nombre identificativo del rol (por ejemplo: "Super Admin", "MCs", "Driver").</td>
          </tr>
          <tr>
            <td><strong>description</strong></td>
            <td>Descripcion textual de la funcion y alcance del rol.</td>
          </tr>
          <tr>
            <td><strong>permissions</strong></td>
            <td>Lista de permisos frontend asociados al rol. Cada permiso habilita funcionalidades especificas en la interfaz.</td>
          </tr>
          <tr>
            <td><strong>organization</strong></td>
            <td>Organizacion a la que pertenece el rol. Si es <code>null</code>, el rol es global y esta disponible para todas las organizaciones.</td>
          </tr>
          <tr>
            <td><strong>protected</strong></td>
            <td>Indica si el rol esta protegido contra eliminacion. Los roles protegidos no pueden borrarse del sistema.</td>
          </tr>
          <tr>
            <td><strong>onlyOwnShipments</strong></td>
            <td>Cuando esta activo, el usuario solo puede ver envios que el mismo creo o que le fueron asignados directamente.</td>
          </tr>
        </tbody>
      </table>

      <h3>Tipos de Roles</h3>
      <p>Existen dos categorias principales de roles en el sistema:</p>

      <h3>Roles Globales</h3>
      <p>
        Los roles globales estan disponibles para todas las organizaciones del sistema. No pertenecen
        a una organizacion especifica y se aplican de manera universal. Estos roles se asignan
        automaticamente cuando un usuario recibe una posicion especial.
      </p>
      <ul>
        <li><strong>Driver:</strong> Asignado automaticamente a usuarios con la posicion <code>driver</code>.</li>
        <li><strong>Mechanic:</strong> Asignado automaticamente a usuarios con la posicion <code>mechanic</code>.</li>
      </ul>

      <h3>Roles Organizacionales</h3>
      <p>
        Los roles organizacionales son especificos de una organizacion. Son creados y gestionados
        por los administradores de esa organizacion y solo se aplican a los usuarios cuando estan
        trabajando en dicha organizacion.
      </p>

      <div class="callout">
        <strong>Concepto clave:</strong> Cuando un usuario cambia de organizacion, sus roles organizacionales
        cambian tambien. Solo se mantienen los roles globales (como Driver o Mechanic) mas los roles
        especificos de la nueva organizacion activa.
      </div>

      <h3>Roles por Defecto del Sistema</h3>
      <table>
        <thead>
          <tr>
            <th>Rol</th>
            <th>Tipo</th>
            <th>Descripcion</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Super Admin</strong></td>
            <td>Protegido</td>
            <td>Acceso completo a todas las funcionalidades del sistema sin restricciones.</td>
          </tr>
          <tr>
            <td><strong>MCs</strong></td>
            <td>Protegido</td>
            <td>Operadores de warehouse. Acceso a funciones de almacen, escaneo y despacho.</td>
          </tr>
          <tr>
            <td><strong>Driver</strong></td>
            <td>Global, protegido</td>
            <td>Conductor de reparto. Auto-asignado por posicion. Acceso a rutas y entregas.</td>
          </tr>
          <tr>
            <td><strong>Mechanic</strong></td>
            <td>Global, protegido</td>
            <td>Tecnico mecanico. Auto-asignado por posicion. Acceso a gestion de vehiculos.</td>
          </tr>
          <tr>
            <td><strong>Flex Route Creator</strong></td>
            <td>Protegido</td>
            <td>Creador de rutas flex. Puede disenar y publicar rutas para flex drivers.</td>
          </tr>
        </tbody>
      </table>

      <h3>Los 3 Niveles de Permisos</h3>
      <p>
        El sistema de permisos de SyncFreight opera en tres niveles que trabajan en conjunto para
        garantizar la seguridad desde la interfaz de usuario hasta la validacion de cada peticion al servidor:
      </p>

      <h3>Nivel 1: Permisos Frontend</h3>
      <p>
        Los permisos frontend controlan la <strong>visibilidad</strong> de elementos en la interfaz de usuario.
        Si un usuario no tiene el permiso correspondiente, el boton, seccion o funcionalidad simplemente
        no aparece en la interfaz.
      </p>
      <p>Cada permiso frontend tiene las siguientes propiedades:</p>
      <ul>
        <li><strong>name:</strong> Nombre descriptivo del permiso (por ejemplo: "Crear envio").</li>
        <li><strong>group:</strong> Grupo al que pertenece el permiso (por ejemplo: "Envios").</li>
        <li><strong>associated backend permissions:</strong> Lista de permisos backend que este permiso frontend requiere.</li>
      </ul>

      <div class="callout">
        <strong>Concepto clave:</strong> Los permisos frontend controlan la visibilidad. Si un usuario no tiene
        permiso para "crear envio", el boton de creacion no aparece en la interfaz. Esto mejora la
        experiencia de usuario al mostrar solo las opciones que realmente puede utilizar.
      </div>

      <h3>Nivel 2: Permisos Backend</h3>
      <p>
        Los permisos backend son verificaciones de seguridad que se ejecutan en cada endpoint de la API.
        Cada permiso backend tiene:
      </p>
      <ul>
        <li><strong>scope:</strong> Descripcion del alcance del permiso (por ejemplo: <code>list_shipments</code>).</li>
        <li><strong>shortcode:</strong> Codigo abreviado de maximo 7 caracteres (por ejemplo: <code>lisship</code>). Este shortcode se incluye en el token JWT.</li>
      </ul>

      <h3>Nivel 3: Validacion en Cada Request</h3>
      <p>
        Al iniciar sesion, los shortcodes de todos los permisos del usuario se incluyen en su token JWT.
        Cuando el usuario realiza una peticion al servidor, el proceso de validacion es:
      </p>
      <ol>
        <li><strong>Decodificacion:</strong> El servidor decodifica el token JWT de la peticion.</li>
        <li><strong>Extraccion:</strong> Se extraen los shortcodes de permisos contenidos en el token.</li>
        <li><strong>Verificacion:</strong> Se verifica que el usuario posea TODOS los shortcodes requeridos por el endpoint solicitado.</li>
        <li><strong>Respuesta:</strong> Si falta algun permiso, la peticion se rechaza con un error <code>401 Unauthorized</code>.</li>
      </ol>

      <div class="callout warning">
        <strong>Importante:</strong> El usuario debe poseer TODOS los permisos requeridos por un endpoint,
        no solo algunos. Si un endpoint requiere los shortcodes <code>lisship</code> y <code>vieship</code>,
        el usuario debe tener ambos en su token JWT para que la peticion sea autorizada.
      </div>

      <h3>Grupos de Permisos</h3>
      <p>
        El sistema cuenta con mas de 60 permisos organizados en grupos funcionales. Los principales
        grupos son:
      </p>
      <table>
        <thead>
          <tr>
            <th>Grupo</th>
            <th>Ambito</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><strong>Users</strong></td><td>Gestion de usuarios</td></tr>
          <tr><td><strong>Roles</strong></td><td>Administracion de roles y permisos</td></tr>
          <tr><td><strong>Shipments</strong></td><td>Envios y ordenes de entrega</td></tr>
          <tr><td><strong>Monitoring</strong></td><td>Monitoreo de operaciones en tiempo real</td></tr>
          <tr><td><strong>Drivers</strong></td><td>Gestion de conductores</td></tr>
          <tr><td><strong>Organizations</strong></td><td>Administracion de organizaciones</td></tr>
          <tr><td><strong>External Orgs</strong></td><td>Organizaciones externas e integraciones</td></tr>
          <tr><td><strong>Anomalies</strong></td><td>Gestion de anomalias e incidencias</td></tr>
          <tr><td><strong>Jobs</strong></td><td>Tareas programadas y procesos batch</td></tr>
          <tr><td><strong>Postal Codes</strong></td><td>Gestion de codigos postales y zonas</td></tr>
          <tr><td><strong>Rates</strong></td><td>Tarifas de envio</td></tr>
          <tr><td><strong>Fuel Surcharge</strong></td><td>Recargos por combustible</td></tr>
          <tr><td><strong>Invoicing</strong></td><td>Facturacion: drivers, facturas, externos, pendientes</td></tr>
          <tr><td><strong>Warehouse</strong></td><td>Operaciones de almacen: bulk scan, pallets, operaciones</td></tr>
          <tr><td><strong>Issues</strong></td><td>Gestion de problemas e incidencias</td></tr>
          <tr><td><strong>Vehicles</strong></td><td>Flota vehicular</td></tr>
          <tr><td><strong>Flex Routes</strong></td><td>Rutas para flex drivers</td></tr>
          <tr><td><strong>Clients</strong></td><td>Gestion de clientes</td></tr>
          <tr><td><strong>Products</strong></td><td>Catalogo de productos</td></tr>
          <tr><td><strong>Orders</strong></td><td>Ordenes de compra</td></tr>
          <tr><td><strong>Promotions</strong></td><td>Promociones y descuentos</td></tr>
          <tr><td><strong>Service Exceptions</strong></td><td>Excepciones de servicio</td></tr>
        </tbody>
      </table>

      <h3>Flag onlyOwnShipments</h3>
      <p>
        El flag <code>onlyOwnShipments</code> es una propiedad especial del rol que restringe la
        visibilidad de envios. Cuando esta activo:
      </p>
      <ul>
        <li>El usuario solo ve envios que el mismo creo.</li>
        <li>El usuario solo ve envios que le fueron asignados directamente.</li>
        <li>El flag se codifica en el token JWT y se aplica automaticamente en todas las consultas.</li>
        <li>Es util para vendedores externos o agentes que solo deben ver sus propios envios.</li>
      </ul>

      <div class="callout">
        <strong>Concepto clave:</strong> El flag <code>onlyOwnShipments</code> proporciona una capa adicional
        de seguridad de datos. Aunque un usuario tenga permisos para listar envios, este flag
        asegura que solo vea los que le corresponden, sin necesidad de filtros manuales.
      </div>
    `,
    test: {
      questions: [
        {
          id: 'c7l4q1',
          question: 'Que diferencia hay entre un rol global y un rol organizacional?',
          options: [
            { id: 'a', text: 'Los roles globales tienen mas permisos que los organizacionales', explanation: 'La diferencia no es de cantidad de permisos sino de alcance; un rol organizacional puede tener tantos permisos como uno global.' },
            { id: 'b', text: 'Los roles globales estan disponibles para todas las organizaciones; los organizacionales son especificos de una' },
            { id: 'c', text: 'Los roles organizacionales no pueden modificarse', explanation: 'Los roles organizacionales si pueden modificarse; son creados y gestionados por cada organizacion segun sus necesidades.' },
            { id: 'd', text: 'No existe diferencia, son terminos intercambiables', explanation: 'Si existe una diferencia fundamental de alcance: los globales aplican a todas las organizaciones y los organizacionales solo a una especifica.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c7l4q2',
          question: 'Que controlan los permisos de Nivel 1 (Frontend)?',
          options: [
            { id: 'a', text: 'La velocidad de carga de la interfaz', explanation: 'La velocidad de carga es un aspecto de rendimiento, no de permisos; el Nivel 1 controla la visibilidad, no el rendimiento.' },
            { id: 'b', text: 'La visibilidad de elementos en la interfaz de usuario' },
            { id: 'c', text: 'La validacion de datos en formularios', explanation: 'La validacion de datos en formularios es logica de aplicacion, no de permisos de frontend.' },
            { id: 'd', text: 'El acceso a la base de datos', explanation: 'El acceso a la base de datos es responsabilidad del backend (Nivel 2 y 3), no del frontend.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c7l4q3',
          question: 'Que es un shortcode en el sistema de permisos?',
          options: [
            { id: 'a', text: 'Un codigo QR para acceso rapido', explanation: 'Los shortcodes no son codigos QR; son codigos de texto abreviados que se incluyen en el token JWT para validacion de permisos.' },
            { id: 'b', text: 'Un codigo abreviado de maximo 7 caracteres que representa un permiso backend y se incluye en el JWT' },
            { id: 'c', text: 'Un atajo de teclado para funciones del frontend', explanation: 'Los shortcodes no son atajos de teclado; son representaciones compactas de permisos backend dentro del JWT.' },
            { id: 'd', text: 'Un identificador unico de la organizacion', explanation: 'Los shortcodes identifican permisos, no organizaciones; cada shortcode representa una capacidad especifica del sistema.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c7l4q4',
          question: 'Que ocurre si un usuario no tiene todos los shortcodes requeridos por un endpoint?',
          options: [
            { id: 'a', text: 'La peticion se ejecuta con funcionalidad parcial', explanation: 'No existe ejecucion parcial; si faltan shortcodes requeridos, el acceso se deniega completamente.' },
            { id: 'b', text: 'Se le solicitan credenciales adicionales', explanation: 'El sistema no solicita credenciales adicionales; la validacion es automatica basada en los shortcodes del JWT.' },
            { id: 'c', text: 'La peticion se rechaza con error 401 Unauthorized' },
            { id: 'd', text: 'Se le redirige a la pagina de inicio', explanation: 'La redireccion es un comportamiento de frontend; a nivel de backend, la respuesta es un error 401 que rechaza la peticion.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c7l4q5',
          question: 'Para que sirve el flag onlyOwnShipments en un rol?',
          options: [
            { id: 'a', text: 'Para que el usuario solo pueda crear envios propios', explanation: 'onlyOwnShipments no restringe la creacion de envios; controla la visibilidad, es decir, que envios puede ver el usuario.' },
            { id: 'b', text: 'Para restringir la visibilidad a envios creados por o asignados al usuario' },
            { id: 'c', text: 'Para que el usuario solo pueda modificar sus envios', explanation: 'Este flag no controla la capacidad de modificacion; su funcion es limitar que envios son visibles para el usuario.' },
            { id: 'd', text: 'Para ocultar los envios completados del usuario', explanation: 'onlyOwnShipments no filtra por estado del envio; filtra por propiedad, mostrando solo los envios creados por o asignados al usuario.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c7l4q6',
          question: 'Cual de los siguientes es un rol por defecto protegido del sistema?',
          options: [
            { id: 'a', text: 'Warehouse Manager', explanation: 'Warehouse Manager no es un rol protegido por defecto del sistema; puede ser un rol organizacional creado por una empresa.' },
            { id: 'b', text: 'Fleet Coordinator', explanation: 'Fleet Coordinator no es un rol protegido del sistema; puede ser creado como rol personalizado pero no viene preinstalado como protegido.' },
            { id: 'c', text: 'Super Admin' },
            { id: 'd', text: 'Regional Director', explanation: 'Regional Director no es un rol protegido del sistema; es un rol organizacional que puede ser creado y eliminado libremente.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c7l4q7',
          question: 'Cuantos niveles de permisos tiene el sistema de SyncFreight?',
          options: [
            { id: 'a', text: '1 nivel: solo frontend', explanation: 'Un solo nivel de frontend seria insuficiente y facilmente eludible; SyncFreight implementa proteccion en multiples capas.' },
            { id: 'b', text: '2 niveles: frontend y backend', explanation: 'Aunque frontend y backend son dos de los niveles, falta el tercer nivel de validacion de shortcodes en cada request via JWT.' },
            { id: 'c', text: '3 niveles: frontend, backend y validacion en cada request' },
            { id: 'd', text: '4 niveles: frontend, backend, base de datos y red', explanation: 'SyncFreight no implementa niveles de permisos a nivel de base de datos ni de red; el sistema opera con 3 niveles.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c7l4q8',
          question: 'Que propiedad de un rol indica que no puede ser eliminado del sistema?',
          options: [
            { id: 'a', text: 'enabled', explanation: 'La propiedad "enabled" controla si un rol esta activo o no, pero no impide que sea eliminado del sistema.' },
            { id: 'b', text: 'locked', explanation: '"locked" no es una propiedad del modelo de roles en SyncFreight.' },
            { id: 'c', text: 'protected' },
            { id: 'd', text: 'permanent', explanation: '"permanent" no es una propiedad del modelo de roles en SyncFreight.' }
          ],
          correctOptionId: 'c'
        }
      ]
    }
  },
  {
    title: 'Autenticacion y Seguridad',
    order: 5,
    content: `
      <h2>Autenticacion y Seguridad</h2>
      <p>
        El sistema de autenticacion de SyncFreight esta disenado para garantizar la seguridad
        de las sesiones de usuario mediante tokens firmados digitalmente. Este mecanismo protege
        tanto la identidad del usuario como la integridad de cada peticion al servidor.
      </p>

      <h3>Metodos de Inicio de Sesion</h3>
      <p>SyncFreight soporta dos metodos de autenticacion:</p>

      <h3>1. Email + contraseña</h3>
      <p>
        Es el metodo estandar de autenticacion. El usuario proporciona su email y contraseña,
        y opcionalmente selecciona la organizacion y el nodo donde desea trabajar. Si el usuario
        pertenece a una sola organizacion con un solo nodo, la seleccion es automatica.
      </p>

      <h3>2. Refresh Token</h3>
      <p>
        Permite renovar la sesion sin que el usuario tenga que ingresar sus credenciales nuevamente.
        El sistema utiliza el refresh token almacenado para generar un nuevo access token de forma
        transparente para el usuario.
      </p>

      <h3>Sistema de Tokens</h3>
      <p>
        SyncFreight utiliza un sistema de doble token para gestionar las sesiones de usuario de
        forma segura:
      </p>
      <table>
        <thead>
          <tr>
            <th>Caracteristica</th>
            <th>Access Token</th>
            <th>Refresh Token</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Formato</strong></td>
            <td>JWT (JSON Web Token)</td>
            <td>Token opaco (no decodificable)</td>
          </tr>
          <tr>
            <td><strong>Duracion</strong></td>
            <td>12 horas</td>
            <td>24 horas</td>
          </tr>
          <tr>
            <td><strong>Proposito</strong></td>
            <td>Autenticar cada peticion al servidor</td>
            <td>Renovar el access token sin requerir credenciales</td>
          </tr>
          <tr>
            <td><strong>Uso</strong></td>
            <td>Se envia en cada peticion HTTP al servidor</td>
            <td>Se usa unicamente para obtener un nuevo access token</td>
          </tr>
          <tr>
            <td><strong>Especificidad</strong></td>
            <td>Contiene datos del usuario y permisos</td>
            <td>Puede ser especifico por dispositivo</td>
          </tr>
        </tbody>
      </table>

      <h3>Contenido del Access Token (JWT)</h3>
      <p>El access token JWT contiene la siguiente informacion codificada:</p>
      <ul>
        <li><strong>Identidad del usuario:</strong> ID unico, nombre y email del usuario.</li>
        <li><strong>Permisos (shortcodes):</strong> Lista de shortcodes de todos los permisos que el usuario posee, combinando los de sus roles.</li>
        <li><strong>Organizacion actual:</strong> La organizacion en la que el usuario esta trabajando (<code>lastOrg</code>).</li>
        <li><strong>Nodo actual:</strong> El warehouse donde el usuario esta operando (<code>lastNode</code>).</li>
        <li><strong>Roles:</strong> Lista de roles asignados al usuario en la organizacion actual.</li>
      </ul>

      <div class="callout">
        <strong>Concepto clave:</strong> El access token JWT es autosuficiente. Contiene toda la informacion
        necesaria para que el servidor valide la identidad y permisos del usuario sin consultar la
        base de datos en cada peticion. Esto mejora significativamente el rendimiento del sistema.
      </div>

      <h3>Seguridad de los Tokens</h3>

      <h3>Firma Digital RS256</h3>
      <p>
        Los tokens se firman utilizando el algoritmo <strong>RS256</strong> (RSA con SHA-256). Este es un
        algoritmo de firma asimetrica que utiliza:
      </p>
      <ul>
        <li><strong>Clave privada:</strong> Utilizada por el servidor para firmar los tokens. Solo el servidor la posee.</li>
        <li><strong>Clave publica:</strong> Utilizada para verificar la autenticidad de los tokens. Puede distribuirse sin riesgo.</li>
      </ul>

      <h3>Gestion de Claves en Produccion</h3>
      <p>
        En entornos de produccion, las claves criptograficas se almacenan en
        <strong>Google Cloud Secret Manager</strong>, un servicio que proporciona almacenamiento seguro,
        control de acceso y auditoria de las claves utilizadas para firmar los tokens.
      </p>

      <h3>Rotacion de Refresh Tokens</h3>
      <p>
        Por seguridad, los refresh tokens se rotan en cada inicio de sesion. Cuando un usuario
        inicia sesion:
      </p>
      <ol>
        <li>Se genera un nuevo par de tokens (access + refresh).</li>
        <li>El refresh token anterior se invalida automaticamente.</li>
        <li>Solo el nuevo refresh token puede utilizarse para renovar la sesion.</li>
      </ol>

      <div class="callout warning">
        <strong>Importante:</strong> Si un atacante obtiene un refresh token antiguo, este ya no sera
        valido porque fue invalidado al emitir uno nuevo. Este mecanismo de rotacion limita
        significativamente la ventana de vulnerabilidad en caso de compromiso de tokens.
      </div>

      <h3>Tokens Especificos por Dispositivo</h3>
      <p>
        Cuando se proporciona un identificador de dispositivo (device ID) durante el login,
        los refresh tokens se vinculan a ese dispositivo especifico. Esto significa que:
      </p>
      <ul>
        <li>Cada dispositivo tiene su propio refresh token independiente.</li>
        <li>Iniciar sesion en un nuevo dispositivo no invalida la sesion en otros dispositivos.</li>
        <li>Se puede revocar el acceso de un dispositivo especifico sin afectar los demas.</li>
      </ul>

      <h3>Flujo Completo de Autenticacion</h3>
      <p>El siguiente resumen muestra el flujo completo desde el login hasta la validacion de cada peticion:</p>
      <ol>
        <li><strong>Login:</strong> El usuario envia email + contraseña (y opcionalmente organizacion y nodo).</li>
        <li><strong>Generacion de tokens:</strong> El servidor valida las credenciales y genera un access token JWT (12h) y un refresh token (24h).</li>
        <li><strong>Peticiones autenticadas:</strong> Cada peticion al servidor incluye el access token en el header de autorizacion.</li>
        <li><strong>Validacion:</strong> El servidor decodifica el JWT, extrae los shortcodes y verifica que el usuario tiene los permisos requeridos.</li>
        <li><strong>Renovacion:</strong> Antes de que expire el access token, el cliente usa el refresh token para obtener uno nuevo sin requerir credenciales.</li>
        <li><strong>Rotacion:</strong> Al renovar, se genera un nuevo refresh token y se invalida el anterior.</li>
      </ol>

      <div class="callout">
        <strong>Concepto clave:</strong> La combinacion de access tokens de corta duracion (12h), refresh
        tokens con rotacion automatica y firma RS256 proporciona un equilibrio entre seguridad y
        experiencia de usuario. El usuario no necesita iniciar sesion frecuentemente, pero las
        credenciales de sesion se renuevan constantemente.
      </div>
    `,
    test: {
      questions: [
        {
          id: 'c7l5q1',
          question: 'Cual es la duracion del access token JWT en SyncFreight?',
          options: [
            { id: 'a', text: '1 hora', explanation: '1 hora seria demasiado corta y forzaria renovaciones constantes que afectarian la experiencia del usuario.' },
            { id: 'b', text: '12 horas' },
            { id: 'c', text: '24 horas', explanation: '24 horas es la duracion del refresh token, no del access token; el access token tiene una duracion menor por seguridad.' },
            { id: 'd', text: '48 horas', explanation: '48 horas seria excesivamente larga para un access token, aumentando significativamente el riesgo si el token es comprometido.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c7l5q2',
          question: 'Que algoritmo se utiliza para firmar los tokens JWT?',
          options: [
            { id: 'a', text: 'HS256 (HMAC con SHA-256)', explanation: 'HS256 es un algoritmo simetrico que usa una sola clave compartida, lo cual es menos seguro para este caso que un algoritmo asimetrico.' },
            { id: 'b', text: 'AES-256', explanation: 'AES-256 es un algoritmo de cifrado simetrico, no de firma digital; no se utiliza para firmar tokens JWT.' },
            { id: 'c', text: 'RS256 (RSA con SHA-256)' },
            { id: 'd', text: 'MD5', explanation: 'MD5 es un algoritmo de hash obsoleto con vulnerabilidades conocidas; no es adecuado ni se usa para firmar tokens JWT.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c7l5q3',
          question: 'Que diferencia principal hay entre el access token y el refresh token?',
          options: [
            { id: 'a', text: 'Ambos son JWT con la misma estructura pero diferente duracion', explanation: 'No tienen la misma estructura; el access token es un JWT decodificable con datos del usuario, mientras que el refresh token es opaco.' },
            { id: 'b', text: 'El access token es un JWT decodificable con datos del usuario; el refresh token es opaco y solo sirve para renovar la sesion' },
            { id: 'c', text: 'El refresh token contiene mas permisos que el access token', explanation: 'El refresh token no contiene permisos; es opaco y su unica funcion es obtener un nuevo access token.' },
            { id: 'd', text: 'El access token se usa una sola vez; el refresh token se usa en cada peticion', explanation: 'Es al reves: el access token se envia en cada peticion al backend, mientras que el refresh token solo se usa cuando el access token expira.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c7l5q4',
          question: 'Que sucede con el refresh token anterior cuando un usuario inicia sesion?',
          options: [
            { id: 'a', text: 'Se mantiene activo como respaldo', explanation: 'Mantener tokens anteriores activos seria un riesgo de seguridad; si un token fue comprometido, seguiria siendo utilizable.' },
            { id: 'b', text: 'Se invalida automaticamente al generar uno nuevo' },
            { id: 'c', text: 'Se extiende su duracion por 24 horas mas', explanation: 'El token anterior no se extiende; se reemplaza completamente por uno nuevo para garantizar la seguridad de la sesion.' },
            { id: 'd', text: 'Se almacena en un historial de tokens', explanation: 'No se almacena un historial de tokens; el token anterior se invalida para evitar que pueda ser reutilizado.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c7l5q5',
          question: 'Donde se almacenan las claves criptograficas en el entorno de produccion?',
          options: [
            { id: 'a', text: 'En variables de entorno del servidor', explanation: 'Las variables de entorno no ofrecen el mismo nivel de seguridad, auditoria y rotacion que un servicio especializado de gestion de secretos.' },
            { id: 'b', text: 'En la base de datos Firestore', explanation: 'Almacenar claves criptograficas en Firestore seria inseguro ya que la base de datos no esta disenada para gestionar secretos sensibles.' },
            { id: 'c', text: 'En Google Cloud Secret Manager' },
            { id: 'd', text: 'En un archivo de configuracion local', explanation: 'Un archivo local no es seguro para produccion; podria ser accedido por personas no autorizadas y no ofrece auditoria ni rotacion automatica.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c7l5q6',
          question: 'Que informacion NO se incluye en el access token JWT?',
          options: [
            { id: 'a', text: 'Shortcodes de permisos del usuario', explanation: 'Los shortcodes si se incluyen en el JWT para que el backend pueda validar permisos en cada peticion sin consultar la base de datos.' },
            { id: 'b', text: 'Organizacion actual del usuario', explanation: 'La organizacion actual si se incluye en el JWT para determinar el contexto organizacional de las operaciones del usuario.' },
            { id: 'c', text: 'contraseña encriptada del usuario' },
            { id: 'd', text: 'Nodo actual donde opera el usuario', explanation: 'El nodo actual si se incluye en el JWT para que el backend sepa desde que warehouse opera el usuario.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c7l5q7',
          question: 'Que ventaja proporcionan los tokens especificos por dispositivo?',
          options: [
            { id: 'a', text: 'Permiten iniciar sesion sin contraseña desde dispositivos conocidos', explanation: 'Los tokens por dispositivo no eliminan la necesidad de autenticacion; su ventaja es la gestion granular de sesiones activas.' },
            { id: 'b', text: 'Permiten revocar el acceso de un dispositivo sin afectar sesiones en otros dispositivos' },
            { id: 'c', text: 'Aumentan la duracion del token en dispositivos de confianza', explanation: 'La duracion del token es la misma independientemente del dispositivo; los tokens por dispositivo no modifican tiempos de expiracion.' },
            { id: 'd', text: 'Eliminan la necesidad de refresh tokens', explanation: 'Los refresh tokens siguen siendo necesarios para renovar sesiones; los tokens por dispositivo son una capa adicional, no un reemplazo.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c7l5q8',
          question: 'Cual es la duracion del refresh token en SyncFreight?',
          options: [
            { id: 'a', text: '6 horas', explanation: '6 horas seria menor que la duracion del access token (12 horas), lo cual no tendria sentido ya que el refresh token debe durar mas.' },
            { id: 'b', text: '12 horas', explanation: '12 horas es la duracion del access token, no del refresh token; el refresh token debe durar mas para poder renovar sesiones expiradas.' },
            { id: 'c', text: '24 horas' },
            { id: 'd', text: '7 dias', explanation: '7 dias seria excesivamente largo para un refresh token, aumentando el riesgo de seguridad si el token es comprometido.' }
          ],
          correctOptionId: 'c'
        }
      ]
    }
  }
];
