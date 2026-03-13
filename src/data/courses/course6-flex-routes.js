export const course6Data = {
  title: 'Sistema Flex Routes',
  description: 'Aprende el sistema de rutas flex bajo demanda: clustering, optimizacion, precio sugerido, publicacion en SyncFlex y flujo completo.',
  order: 6,
  published: true,
  totalLessons: 5
};

export const course6Lessons = [
  {
    title: 'Conceptos Fundamentales',
    order: 1,
    content: `
      <h2>Conceptos Fundamentales de Flex Routes</h2>
      <p>
        Las <strong>Flex Routes</strong> son rutas de entrega bajo demanda disenadas para conductores independientes
        (flex riders). Permiten a una organizacion <strong>externalizar entregas</strong> cuando la capacidad interna
        es insuficiente, ofreciendo flexibilidad operativa sin necesidad de mantener una flota propia para cubrir
        picos de demanda.
      </p>

      <h3>Conceptos Clave</h3>
      <p>El sistema de Flex Routes se compone de los siguientes elementos fundamentales:</p>
      <table>
        <thead>
          <tr>
            <th>Concepto</th>
            <th>Descripcion</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Flex Round</strong></td>
            <td>Contenedor que agrupa envios para crear una o multiples rutas flex optimizadas. Es el punto de partida del proceso.</td>
          </tr>
          <tr>
            <td><strong>Flex Route</strong></td>
            <td>Ruta individual con paradas ordenadas, que sera asignada a un conductor independiente.</td>
          </tr>
          <tr>
            <td><strong>Stop (Parada)</strong></td>
            <td>Un punto de entrega dentro de una ruta. Puede contener uno o mas envios si comparten la misma ubicacion de destino.</td>
          </tr>
          <tr>
            <td><strong>Cluster</strong></td>
            <td>Agrupacion geografica de envios. Solo se utiliza en rounds de multiples rutas para dividir los envios en zonas.</td>
          </tr>
          <tr>
            <td><strong>SyncFlex</strong></td>
            <td>Organizacion central donde se publican las rutas para que los conductores independientes las visualicen y acepten.</td>
          </tr>
        </tbody>
      </table>

      <h3>Tipos de Round</h3>
      <p>Existen dos tipos de round, cada uno con un flujo de estados diferente:</p>

      <h3>Round de Multiples Rutas (multiple_routes)</h3>
      <p>Se utiliza cuando hay muchos envios que deben dividirse en varias rutas por zona geografica.</p>
      <pre><code>CREATED -> CLUSTERING_CONFIG -> FLEX_ROUTES_CONFIG -> FINALIZATION -> COMPLETED</code></pre>
      <p>
        Los envios se agrupan en <strong>clusters geograficos</strong>, y cada cluster genera una ruta individual.
        Esto permite distribuir la carga de trabajo entre varios conductores de forma eficiente.
      </p>

      <h3>Round de Ruta Unica (single_route)</h3>
      <p>Se utiliza cuando un grupo de envios forma una sola ruta que sera asignada a un unico conductor.</p>
      <pre><code>CREATED -> FLEX_ROUTES_CONFIG -> FINALIZATION -> COMPLETED</code></pre>
      <p>
        Al no requerir clustering, este tipo de round omite la etapa <code>CLUSTERING_CONFIG</code> y pasa
        directamente a la configuracion de la ruta.
      </p>

      <div class="callout">
        <strong>Diferencia clave:</strong> El round de multiples rutas incluye la etapa de CLUSTERING_CONFIG
        para dividir los envios en zonas geograficas. El round de ruta unica omite esta etapa porque todos
        los envios van en una sola ruta.
      </div>

      <h3>Ciclo de Vida del Round</h3>
      <p>Cada etapa del round tiene un proposito especifico:</p>
      <table>
        <thead>
          <tr>
            <th>Etapa</th>
            <th>Descripcion</th>
            <th>Aplica a</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>CREATED</strong></td>
            <td>Se seleccionan los envios (por codigos de ruta o manualmente) y se registra la ubicacion del warehouse como punto de origen.</td>
            <td>Ambos tipos</td>
          </tr>
          <tr>
            <td><strong>CLUSTERING_CONFIG</strong></td>
            <td>Se configuran los clusters geograficos para agrupar los envios por zona.</td>
            <td>Solo multiple_routes</td>
          </tr>
          <tr>
            <td><strong>FLEX_ROUTES_CONFIG</strong></td>
            <td>Se configuran y optimizan las rutas individuales, determinando el orden optimo de paradas.</td>
            <td>Ambos tipos</td>
          </tr>
          <tr>
            <td><strong>FINALIZATION</strong></td>
            <td>Se revisan las rutas, se asignan precios y se publican en SyncFlex para que los conductores las acepten.</td>
            <td>Ambos tipos</td>
          </tr>
          <tr>
            <td><strong>COMPLETED</strong></td>
            <td>Todas las rutas han sido asignadas y despachadas. El round tambien puede pasar a CANCELED.</td>
            <td>Ambos tipos</td>
          </tr>
        </tbody>
      </table>

      <h3>Seleccion de Envios</h3>
      <p>Al crear un round, los envios pueden agregarse de tres formas:</p>
      <ul>
        <li><strong>Por codigos de ruta:</strong> Se ingresan codigos de ruta y el sistema incluye automaticamente todos los envios que coincidan con esos codigos.</li>
        <li><strong>Agregados manualmente:</strong> Se anaden envios individuales usando sus numeros de tracking.</li>
        <li><strong>Excluidos manualmente:</strong> Se pueden excluir envios especificos que fueron incluidos automaticamente por codigo de ruta.</li>
      </ul>

      <div class="callout warning">
        <strong>Importante:</strong> Solo los envios que tengan geocodificacion (coordenadas lat/lng) pueden
        ser incluidos en un round. Los envios sin coordenadas no podran ser procesados por el sistema de
        clustering ni de optimizacion de rutas.
      </div>
    `,
    test: {
      questions: [
        {
          id: 'c6l1q1',
          question: 'Que es un Flex Round?',
          options: [
            { id: 'a', text: 'Un contenedor que agrupa envios para crear una o multiples rutas flex optimizadas' },
            { id: 'b', text: 'Una ruta individual asignada a un conductor independiente', explanation: 'Esto describe una Flex Route, no un Flex Round. El round es el contenedor que agrupa envios para generar las rutas.' },
            { id: 'c', text: 'Un punto de entrega dentro de una ruta', explanation: 'Esto describe un Stop (parada), no un Flex Round. El round es el contenedor inicial que agrupa envios.' },
            { id: 'd', text: 'Un algoritmo de optimizacion de rutas', explanation: 'Un Flex Round no es un algoritmo. Es un contenedor que agrupa envios para crear rutas flex optimizadas.' }
          ],
          correctOptionId: 'a'
        },
        {
          id: 'c6l1q2',
          question: 'Cual es la diferencia principal entre un round de multiples rutas y uno de ruta unica?',
          options: [
            { id: 'a', text: 'El round de ruta unica no permite publicar en SyncFlex', explanation: 'Ambos tipos de round permiten publicar en SyncFlex. La diferencia real esta en la etapa de clustering.' },
            { id: 'b', text: 'El round de multiples rutas incluye la etapa CLUSTERING_CONFIG que el de ruta unica omite' },
            { id: 'c', text: 'El round de ruta unica no requiere optimizacion', explanation: 'Ambos tipos de round requieren optimizacion de rutas. La diferencia es que el de multiples rutas incluye la etapa CLUSTERING_CONFIG.' },
            { id: 'd', text: 'El round de multiples rutas no pasa por FINALIZATION', explanation: 'Ambos tipos de round pasan por la etapa FINALIZATION. La diferencia esta en que solo el de multiples rutas incluye CLUSTERING_CONFIG.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c6l1q3',
          question: 'Que es SyncFlex?',
          options: [
            { id: 'a', text: 'Un algoritmo de clustering geografico', explanation: 'SyncFlex no es un algoritmo. Es la organizacion central donde se publican las rutas para conductores independientes.' },
            { id: 'b', text: 'Una aplicacion movil para conductores', explanation: 'SyncFlex no es una aplicacion movil. Es la organizacion central que actua como punto de conexion entre organizaciones y conductores.' },
            { id: 'c', text: 'La organizacion central donde se publican las rutas para que los conductores las acepten' },
            { id: 'd', text: 'Un tipo de vehiculo utilizado en entregas flex', explanation: 'SyncFlex no es un tipo de vehiculo. Es la organizacion central donde se publican las rutas flex para que los conductores las acepten.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c6l1q4',
          question: 'Que ocurre en la etapa FINALIZATION de un round?',
          options: [
            { id: 'a', text: 'Se seleccionan los envios y se registra el warehouse', explanation: 'La seleccion de envios y registro del warehouse ocurre al inicio del proceso, no en la etapa FINALIZATION.' },
            { id: 'b', text: 'Se configuran los clusters geograficos', explanation: 'La configuracion de clusters ocurre en la etapa CLUSTERING_CONFIG, no en FINALIZATION.' },
            { id: 'c', text: 'Se optimizan las rutas individuales', explanation: 'La optimizacion de rutas ocurre en una etapa previa a FINALIZATION. En FINALIZATION se revisan, asignan precios y publican.' },
            { id: 'd', text: 'Se revisan las rutas, se asignan precios y se publican en SyncFlex' }
          ],
          correctOptionId: 'd'
        },
        {
          id: 'c6l1q5',
          question: 'Que es un Stop dentro de una Flex Route?',
          options: [
            { id: 'a', text: 'Un error que detiene la optimizacion', explanation: 'Un Stop no es un error del sistema. Es un punto de entrega dentro de la ruta que puede agrupar uno o mas envios.' },
            { id: 'b', text: 'Un punto de entrega que puede contener uno o mas envios en la misma ubicacion' },
            { id: 'c', text: 'El warehouse de origen de la ruta', explanation: 'El warehouse de origen no es un Stop. Los stops son los puntos de entrega a los que el conductor debe ir durante la ruta.' },
            { id: 'd', text: 'Una pausa obligatoria del conductor durante la ruta', explanation: 'Un Stop no es una pausa obligatoria. Es un punto de entrega donde el conductor debe dejar uno o mas paquetes.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c6l1q6',
          question: 'De que formas se pueden agregar envios a un round?',
          options: [
            { id: 'a', text: 'Solo por codigos de ruta', explanation: 'Los codigos de ruta son solo una de las tres formas disponibles. Tambien se pueden agregar manualmente por tracking o excluyendo envios especificos.' },
            { id: 'b', text: 'Solo manualmente usando numeros de tracking', explanation: 'El tracking manual es solo una de las tres formas disponibles. Tambien se pueden agregar por codigos de ruta o excluyendo envios especificos.' },
            { id: 'c', text: 'Por codigos de ruta, manualmente por tracking, o excluyendo envios especificos' },
            { id: 'd', text: 'Solo importando un archivo CSV', explanation: 'El sistema no utiliza importacion CSV para agregar envios. Las tres formas son: por codigos de ruta, manualmente por tracking, o excluyendo envios especificos.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c6l1q7',
          question: 'Que requisito deben cumplir los envios para ser incluidos en un round?',
          options: [
            { id: 'a', text: 'Deben tener un peso mayor a 1 kg', explanation: 'No existe un requisito de peso minimo. El requisito es tener geocodificacion (coordenadas lat/lng) para ser ubicados en el mapa.' },
            { id: 'b', text: 'Deben tener geocodificacion (coordenadas lat/lng)' },
            { id: 'c', text: 'Deben estar asignados a un conductor previamente', explanation: 'Los envios no necesitan tener conductor asignado previamente. El requisito es contar con geocodificacion para el clustering y optimizacion.' },
            { id: 'd', text: 'Deben pertenecer a la misma zona postal', explanation: 'No es necesario que los envios pertenezcan a la misma zona postal. El requisito es tener coordenadas lat/lng; el clustering se encarga de agruparlos geograficamente.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c6l1q8',
          question: 'Cuando se usa un Cluster en el sistema de Flex Routes?',
          options: [
            { id: 'a', text: 'En todos los tipos de round para agrupar envios', explanation: 'El clustering no se usa en todos los tipos de round. En rounds de ruta unica no se necesita porque todos los envios van en una sola ruta.' },
            { id: 'b', text: 'Solo en rounds de ruta unica', explanation: 'Es al contrario: los rounds de ruta unica no usan clustering. El clustering se aplica solo en rounds de multiples rutas para dividir envios en zonas.' },
            { id: 'c', text: 'Solo en rounds de multiples rutas para dividir envios en zonas geograficas' },
            { id: 'd', text: 'Solo durante la etapa FINALIZATION', explanation: 'El clustering no ocurre en FINALIZATION. Se ejecuta en la etapa CLUSTERING_CONFIG, que es exclusiva de rounds de multiples rutas.' }
          ],
          correctOptionId: 'c'
        }
      ]
    }
  },
  {
    title: 'Clustering y Capacidad',
    order: 2,
    content: `
      <h2>Clustering y Capacidad de Vehiculos</h2>
      <p>
        El clustering es el proceso de agrupar envios en <strong>zonas geograficas</strong> para generar rutas
        eficientes. Este paso es fundamental en los rounds de multiples rutas, ya que determina como se dividen
        los envios entre los diferentes conductores.
      </p>

      <h3>Algoritmos de Clustering</h3>
      <p>El sistema ofrece tres algoritmos de clustering, cada uno con caracteristicas distintas:</p>
      <table>
        <thead>
          <tr>
            <th>Algoritmo</th>
            <th>Descripcion</th>
            <th>Uso recomendado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>K-Means</strong></td>
            <td>Agrupa los envios en N clusters predefinidos. El usuario especifica cuantos clusters desea y el algoritmo distribuye los envios de forma equilibrada.</td>
            <td>Es el mas comun. Ideal cuando se conoce de antemano cuantos conductores se necesitan.</td>
          </tr>
          <tr>
            <td><strong>DBSCAN</strong></td>
            <td>Agrupa por densidad geografica. Detecta automaticamente cuantos clusters hay segun la concentracion de puntos de entrega.</td>
            <td>Util cuando los envios tienen zonas de alta densidad claramente diferenciadas.</td>
          </tr>
          <tr>
            <td><strong>Hierarchical</strong></td>
            <td>Construye una jerarquia de agrupaciones, permitiendo diferentes niveles de granularidad.</td>
            <td>Adecuado para analisis de estructura geografica de los envios.</td>
          </tr>
        </tbody>
      </table>

      <div class="callout">
        <strong>Nota:</strong> K-Means es el algoritmo mas utilizado en la practica porque permite al operador
        definir exactamente cuantas rutas desea generar, lo cual facilita la planificacion de recursos.
      </div>

      <h3>Metricas del Cluster</h3>
      <p>Una vez ejecutado el algoritmo, cada cluster calcula las siguientes metricas:</p>
      <table>
        <thead>
          <tr>
            <th>Metrica</th>
            <th>Descripcion</th>
            <th>Calculo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Centro geografico</strong></td>
            <td>Punto central del cluster en el mapa</td>
            <td>Promedio de coordenadas (lat/lng) de todas las paradas</td>
          </tr>
          <tr>
            <td><strong>Radio</strong></td>
            <td>Extension maxima del cluster</td>
            <td>Distancia maxima desde el centro a cualquier parada</td>
          </tr>
          <tr>
            <td><strong>Volumen total</strong></td>
            <td>Espacio total que ocupan los envios</td>
            <td>Suma de volumenes de todos los envios (en pies cubicos)</td>
          </tr>
          <tr>
            <td><strong>Peso total</strong></td>
            <td>Peso combinado de todos los envios</td>
            <td>Suma de pesos de todos los envios</td>
          </tr>
          <tr>
            <td><strong>Numero de paradas</strong></td>
            <td>Ubicaciones unicas de entrega</td>
            <td>Conteo de ubicaciones distintas (varias entregas en la misma direccion cuentan como una parada)</td>
          </tr>
          <tr>
            <td><strong>Vehiculos necesarios</strong></td>
            <td>Cantidad estimada de vehiculos</td>
            <td><code>ceil(volumen_total / 40)</code> (40 pies cubicos por vehiculo)</td>
          </tr>
          <tr>
            <td><strong>Color</strong></td>
            <td>Identificador visual</td>
            <td>Color asignado para distinguir el cluster en el mapa</td>
          </tr>
        </tbody>
      </table>

      <h3>Estados del Cluster</h3>
      <p>Cada cluster pasa por los siguientes estados durante el proceso de optimizacion:</p>
      <pre><code>pending -> optimizing -> optimized (o failed)</code></pre>
      <ul>
        <li><strong>pending:</strong> El cluster ha sido creado pero aun no se ha iniciado la optimizacion de su ruta.</li>
        <li><strong>optimizing:</strong> El motor de optimizacion esta procesando la ruta del cluster.</li>
        <li><strong>optimized:</strong> La ruta del cluster ha sido optimizada exitosamente.</li>
        <li><strong>failed:</strong> La optimizacion fallo por algun motivo (datos incompletos, timeout, etc.).</li>
      </ul>

      <h3>Capacidad de Vehiculos</h3>
      <p>El sistema contempla tres configuraciones de vehiculo segun el espacio disponible para carga:</p>
      <table>
        <thead>
          <tr>
            <th>Tipo de Vehiculo</th>
            <th>Capacidad (pies cubicos)</th>
            <th>Descripcion</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Trunk Only</strong></td>
            <td>14 ft3</td>
            <td>Solo se utiliza el maletero/baul del vehiculo.</td>
          </tr>
          <tr>
            <td><strong>Trunk + Rear</strong></td>
            <td>35 ft3</td>
            <td>Se utiliza el maletero y la parte trasera del vehiculo.</td>
          </tr>
          <tr>
            <td><strong>Full Cabin</strong></td>
            <td>55 ft3</td>
            <td>Se utiliza toda la cabina del vehiculo para carga.</td>
          </tr>
        </tbody>
      </table>

      <h3>Calculo de Volumen por Envio</h3>
      <p>El volumen de cada envio se calcula a partir de sus dimensiones fisicas:</p>
      <pre><code>Volumen (ft3) = (largo x ancho x alto) / 12^3</code></pre>
      <p>
        La division por <code>12^3</code> (1,728) convierte las dimensiones de pulgadas a pies cubicos.
        Esto es necesario porque las dimensiones de los envios se registran en pulgadas, pero la capacidad
        de los vehiculos se mide en pies cubicos.
      </p>

      <div class="callout warning">
        <strong>Importante:</strong> Solo los envios que tengan geocodificacion (coordenadas latitud/longitud)
        son incluidos en los clusters. Si un envio no tiene coordenadas, no podra ser ubicado en el mapa
        y sera excluido del proceso de clustering.
      </div>

      <h3>Ejemplo Practico</h3>
      <p>Supongamos un cluster con las siguientes caracteristicas:</p>
      <ul>
        <li>25 envios repartidos en 20 paradas unicas</li>
        <li>Volumen total: 95 pies cubicos</li>
        <li>Vehiculos necesarios: <code>ceil(95 / 40) = 3</code> vehiculos</li>
      </ul>
      <p>
        Esto significa que el cluster necesitaria al menos 3 vehiculos con capacidad estandar (40 ft3)
        para transportar todos los envios. El operador puede ajustar este calculo segun el tipo de vehiculo
        que vayan a utilizar los conductores.
      </p>
    `,
    test: {
      questions: [
        {
          id: 'c6l2q4',
          question: 'Como se calcula el volumen de un envio en pies cubicos?',
          options: [
            { id: 'a', text: '(largo + ancho + alto) / 12', explanation: 'Las dimensiones deben multiplicarse (no sumarse) para obtener volumen. Ademas, la division correcta es por 12^3 (1,728), no por 12.' },
            { id: 'b', text: 'largo x ancho x alto', explanation: 'Esta formula da el volumen en pulgadas cubicas, pero falta dividir por 12^3 (1,728) para convertirlo a pies cubicos.' },
            { id: 'c', text: '(largo x ancho x alto) / 12^3' },
            { id: 'd', text: '(largo x ancho x alto) / 100', explanation: 'El divisor correcto es 12^3 (1,728), no 100. Se divide por 1,728 porque hay 12 pulgadas por pie, y se necesita convertir pulgadas cubicas a pies cubicos.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c6l2q8',
          question: 'En un cluster con 25 envios repartidos en 20 paradas, cual es el numero de paradas del cluster?',
          options: [
            { id: 'a', text: '25, porque cuenta cada envio individual', explanation: '25 es el numero de envios, no de paradas. Las paradas cuentan ubicaciones unicas; varios envios en la misma direccion forman una sola parada.' },
            { id: 'b', text: '20, porque cuenta ubicaciones unicas de entrega' },
            { id: 'c', text: '45, porque suma envios y paradas', explanation: 'Sumar envios y paradas no tiene sentido. El numero de paradas es el conteo de ubicaciones unicas de entrega, que en este caso es 20.' },
            { id: 'd', text: 'Depende del volumen total de los envios', explanation: 'El numero de paradas no depende del volumen. Se determina por la cantidad de ubicaciones unicas de entrega, independientemente del tamano de los envios.' }
          ],
          correctOptionId: 'b'
        }
      ]
    }
  },
  {
    title: 'Optimizacion de Rutas',
    order: 3,
    content: `
      <h2>Optimizacion de Rutas</h2>
      <p>
        La optimizacion de rutas es el proceso de determinar el <strong>orden optimo de las paradas</strong>
        dentro de cada ruta flex. El sistema utiliza diferentes motores de optimizacion dependiendo del tipo
        de round.
      </p>

      <h3>Optimizacion para Rounds de Multiples Rutas (Clusters)</h3>
      <p>
        Cuando se trabaja con clusters, el sistema utiliza <strong>TimeFold Vehicle Routing</strong>, un motor
        especializado en problemas de ruteo de vehiculos (VRP - Vehicle Routing Problem).
      </p>
      <p>TimeFold construye el problema considerando:</p>
      <ul>
        <li><strong>Ubicaciones de las paradas:</strong> Coordenadas geograficas de cada punto de entrega.</li>
        <li><strong>Demanda:</strong> Volumen de los envios en cada parada.</li>
        <li><strong>Capacidad del vehiculo:</strong> Espacio disponible segun el tipo de vehiculo configurado.</li>
        <li><strong>Ventanas de tiempo:</strong> Restricciones horarias para las entregas si aplican.</li>
      </ul>
      <p>
        El motor devuelve las rutas optimas por vehiculo, minimizando la distancia total recorrida mientras
        respeta las restricciones de capacidad y tiempo.
      </p>

      <h3>Optimizacion para Rutas Unicas</h3>
      <p>
        Para rounds de ruta unica, el sistema utiliza <strong>OSRM</strong> (Open Source Routing Machine)
        combinado con multiples heuristicas de optimizacion:
      </p>
      <table>
        <thead>
          <tr>
            <th>Heuristica</th>
            <th>Calidad de solucion</th>
            <th>Velocidad</th>
            <th>Descripcion</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Lin-Kernighan</strong></td>
            <td>Mejor solucion</td>
            <td>Mas lenta</td>
            <td>Algoritmo avanzado que mejora iterativamente la ruta mediante intercambios de segmentos.</td>
          </tr>
          <tr>
            <td><strong>Farthest Insertion</strong></td>
            <td>Equilibrada</td>
            <td>Media</td>
            <td>Inserta las paradas mas lejanas primero para construir una ruta envolvente.</td>
          </tr>
          <tr>
            <td><strong>Nearest Neighbour</strong></td>
            <td>Basica</td>
            <td>Mas rapida</td>
            <td>En cada paso, visita la parada mas cercana a la posicion actual.</td>
          </tr>
        </tbody>
      </table>

      <h3>Proceso de Seleccion de Variantes</h3>
      <p>El sistema ejecuta un proceso exhaustivo para encontrar la mejor ruta posible:</p>
      <ol>
        <li>Se ejecutan las <strong>3 heuristicas</strong> (Lin-Kernighan, Farthest Insertion, Nearest Neighbour).</li>
        <li>Cada heuristica se ejecuta con <strong>2 tipos de matriz de distancia</strong>: "calculated" (distancia calculada por OSRM considerando calles reales) y "distance" (distancia euclidiana directa).</li>
        <li>Esto genera <strong>6 variantes</strong> de ruta (3 heuristicas x 2 matrices).</li>
        <li>El sistema selecciona las <strong>2 mejores variantes</strong> (una por cada tipo de matriz).</li>
        <li>Estas 2 opciones se presentan al usuario para que elija la que prefiera.</li>
      </ol>
      <p>
        Mientras el sistema selecciona las mejores opciones, la ruta pasa al estado
        <code>PENDING_SELECTION</code>, indicando que requiere intervencion del operador para elegir
        la variante definitiva.
      </p>

      <div class="callout">
        <strong>Nota:</strong> La matriz "calculated" suele producir mejores resultados porque considera
        la red vial real (calles, sentidos, restricciones), mientras que la matriz "distance" usa distancias
        en linea recta. Sin embargo, la matriz "distance" puede ser util en zonas rurales donde las rutas
        son mas directas.
      </div>

      <h3>Requisitos para la Optimizacion</h3>
      <p>Para que una ruta pueda ser optimizada, debe cumplir estos requisitos:</p>
      <ul>
        <li><strong>Minimo 3 paradas:</strong> La ruta debe tener al menos 3 puntos de entrega para que la optimizacion tenga sentido.</li>
        <li><strong>Maximo 250 paradas:</strong> Limite superior por restricciones de rendimiento del motor de optimizacion.</li>
        <li><strong>Geocodificacion:</strong> Cada envio debe tener coordenadas (latitud/longitud) validas.</li>
      </ul>

      <h3>Estados de una Flex Route</h3>
      <p>Una flex route pasa por los siguientes estados durante su ciclo de vida completo:</p>
      <pre><code>CREATED -> OPTIMIZING -> OPTIMIZED -> PENDING_SELECTION -> READY_TO_ASSIGN -> ASSIGNED -> IN_PROGRESS -> RETURN_TO_WAREHOUSE -> COMPLETED</code></pre>

      <table>
        <thead>
          <tr>
            <th>Estado</th>
            <th>Descripcion</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>CREATED</strong></td>
            <td>La ruta ha sido creada con sus paradas pero aun no se ha optimizado.</td>
          </tr>
          <tr>
            <td><strong>OPTIMIZING</strong></td>
            <td>El motor de optimizacion esta procesando la ruta.</td>
          </tr>
          <tr>
            <td><strong>OPTIMIZED</strong></td>
            <td>La optimizacion se completo exitosamente.</td>
          </tr>
          <tr>
            <td><strong>PENDING_SELECTION</strong></td>
            <td>Hay multiples variantes disponibles y el operador debe seleccionar una.</td>
          </tr>
          <tr>
            <td><strong>READY_TO_ASSIGN</strong></td>
            <td>La ruta esta lista para ser publicada y asignada a un conductor.</td>
          </tr>
          <tr>
            <td><strong>ASSIGNED</strong></td>
            <td>Un conductor ha aceptado la ruta.</td>
          </tr>
          <tr>
            <td><strong>IN_PROGRESS</strong></td>
            <td>El conductor esta realizando las entregas.</td>
          </tr>
          <tr>
            <td><strong>RETURN_TO_WAREHOUSE</strong></td>
            <td>El conductor esta regresando al warehouse con paquetes no entregados.</td>
          </tr>
          <tr>
            <td><strong>COMPLETED</strong></td>
            <td>Todas las entregas fueron completadas o procesadas.</td>
          </tr>
        </tbody>
      </table>

      <h3>Cancelacion de Rutas</h3>
      <p>Una ruta puede ser cancelada desde los siguientes estados:</p>
      <ul>
        <li><code>CREATED</code></li>
        <li><code>OPTIMIZED</code></li>
        <li><code>PENDING_SELECTION</code></li>
        <li><code>FAILED_OPTIMIZATION</code></li>
        <li><code>READY_TO_ASSIGN</code></li>
      </ul>
      <p>No se puede cancelar una ruta que ya esta en estado:</p>
      <ul>
        <li><code>ASSIGNED</code> (ya tiene conductor asignado)</li>
        <li><code>IN_PROGRESS</code> (el conductor ya esta en ruta)</li>
        <li><code>COMPLETED</code> (la ruta ya finalizo)</li>
      </ul>

      <div class="callout warning">
        <strong>Importante:</strong> La ruta tambien puede llegar al estado <code>FAILED_OPTIMIZATION</code>
        si el motor de optimizacion no logra encontrar una solucion valida. Desde este estado, el operador
        puede reintentar la optimizacion o cancelar la ruta.
      </div>
    `,
    test: {
      questions: [
        {
          id: 'c6l3q1',
          question: 'Que motor de optimizacion se utiliza para rounds de multiples rutas (clusters)?',
          options: [
            { id: 'a', text: 'OSRM con heuristicas', explanation: 'OSRM con heuristicas se utiliza para optimizar rutas unicas, no para rounds de multiples rutas. Los clusters usan TimeFold Vehicle Routing.' },
            { id: 'b', text: 'TimeFold Vehicle Routing (VRP)' },
            { id: 'c', text: 'Google Maps API', explanation: 'El sistema no utiliza Google Maps API para la optimizacion. Para clusters se usa TimeFold Vehicle Routing, especializado en problemas VRP.' },
            { id: 'd', text: 'Lin-Kernighan exclusivamente', explanation: 'Lin-Kernighan es una de las heuristicas usadas con OSRM para rutas unicas, no para clusters. Los clusters usan TimeFold Vehicle Routing.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c6l3q2',
          question: 'Cuantas variantes de ruta genera el sistema al optimizar una ruta unica?',
          options: [
            { id: 'a', text: '3 variantes (una por heuristica)', explanation: 'Cada heuristica se ejecuta con 2 tipos de matriz de distancia (calculated y distance), por lo que se generan 6 variantes en total, no 3.' },
            { id: 'b', text: '2 variantes (una por tipo de matriz de distancia)', explanation: '2 es el numero de variantes que se presentan al operador al final, pero el sistema genera 6 variantes inicialmente (3 heuristicas x 2 matrices).' },
            { id: 'c', text: '6 variantes (3 heuristicas x 2 tipos de matriz)' },
            { id: 'd', text: '1 variante optima seleccionada automaticamente', explanation: 'El sistema no selecciona una sola variante automaticamente. Genera 6 variantes, selecciona las 2 mejores y las presenta al operador para que elija.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c6l3q3',
          question: 'Cual de las heuristicas ofrece la mejor solucion pero es la mas lenta?',
          options: [
            { id: 'a', text: 'Nearest Neighbour', explanation: 'Nearest Neighbour es la mas rapida pero ofrece calidad basica. La que produce la mejor solucion (aunque mas lenta) es Lin-Kernighan.' },
            { id: 'b', text: 'Farthest Insertion', explanation: 'Farthest Insertion ofrece una solucion equilibrada con velocidad media. Lin-Kernighan es la que produce la mejor solucion aunque es la mas lenta.' },
            { id: 'c', text: 'Lin-Kernighan' },
            { id: 'd', text: 'DBSCAN', explanation: 'DBSCAN es un algoritmo de clustering, no una heuristica de optimizacion de rutas. Las heuristicas disponibles son Lin-Kernighan, Farthest Insertion y Nearest Neighbour.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c6l3q4',
          question: 'Cual es el numero minimo y maximo de paradas permitido para optimizar una ruta?',
          options: [
            { id: 'a', text: 'Minimo 1, maximo 100', explanation: 'Con solo 1 parada la optimizacion no tiene sentido. El minimo es 3 paradas y el maximo es 250, no 100.' },
            { id: 'b', text: 'Minimo 3, maximo 250' },
            { id: 'c', text: 'Minimo 5, maximo 500', explanation: 'El minimo real es 3 paradas (no 5) y el maximo es 250 (no 500). El limite de 250 se debe a restricciones de rendimiento del motor.' },
            { id: 'd', text: 'Minimo 2, maximo 200', explanation: 'El minimo es 3 paradas (no 2) para que la optimizacion tenga sentido, y el maximo es 250 (no 200) por restricciones de rendimiento.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c6l3q5',
          question: 'Que estado indica que el operador debe elegir entre variantes de ruta?',
          options: [
            { id: 'a', text: 'OPTIMIZED', explanation: 'OPTIMIZED indica que la optimizacion se completo exitosamente, pero no implica que haya variantes pendientes de seleccion por el operador.' },
            { id: 'b', text: 'READY_TO_ASSIGN', explanation: 'READY_TO_ASSIGN indica que la ruta ya esta lista para publicar y asignar a un conductor. La seleccion de variantes ya ocurrio antes.' },
            { id: 'c', text: 'PENDING_SELECTION' },
            { id: 'd', text: 'CREATED', explanation: 'CREATED indica que la ruta fue creada con sus paradas pero aun no se ha optimizado. La seleccion de variantes ocurre despues de la optimizacion.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c6l3q6',
          question: 'Desde cual de estos estados NO se puede cancelar una flex route?',
          options: [
            { id: 'a', text: 'CREATED', explanation: 'Desde CREATED si se puede cancelar porque la ruta aun no ha sido optimizada ni publicada y no hay conductor comprometido.' },
            { id: 'b', text: 'READY_TO_ASSIGN', explanation: 'Desde READY_TO_ASSIGN si se puede cancelar porque aunque la ruta esta publicada, ningun conductor la ha aceptado aun.' },
            { id: 'c', text: 'ASSIGNED' },
            { id: 'd', text: 'PENDING_SELECTION', explanation: 'Desde PENDING_SELECTION si se puede cancelar porque el operador aun no ha elegido la variante de ruta y no hay conductor asignado.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c6l3q7',
          question: 'Que diferencia hay entre la matriz "calculated" y la matriz "distance"?',
          options: [
            { id: 'a', text: 'No hay diferencia, son sinonimos', explanation: 'No son sinonimos. "calculated" usa la red vial real via OSRM (calles, sentidos, restricciones) mientras que "distance" usa distancias euclidiana en linea recta.' },
            { id: 'b', text: '"calculated" usa la red vial real y "distance" usa distancias en linea recta' },
            { id: 'c', text: '"distance" es mas precisa que "calculated"', explanation: 'Es al contrario: "calculated" suele ser mas precisa porque considera la red vial real. "distance" usa linea recta, lo cual es menos preciso en zonas urbanas.' },
            { id: 'd', text: '"calculated" solo funciona en zonas urbanas', explanation: '"calculated" funciona en cualquier zona, no solo urbanas. Usa la red vial real via OSRM independientemente de la ubicacion geografica.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c6l3q8',
          question: 'Cuantas variantes presenta finalmente el sistema al operador para seleccion?',
          options: [
            { id: 'a', text: '6, todas las generadas', explanation: 'El sistema genera 6 variantes pero no las presenta todas. Selecciona las 2 mejores (una por tipo de matriz) para que el operador elija.' },
            { id: 'b', text: '3, una por heuristica', explanation: 'No se presenta una por heuristica. De las 6 variantes generadas, el sistema selecciona las 2 mejores: la mejor de cada tipo de matriz de distancia.' },
            { id: 'c', text: '2, la mejor de cada tipo de matriz de distancia' },
            { id: 'd', text: '1, la mejor de todas', explanation: 'El sistema no selecciona una sola variante. Presenta 2 opciones al operador: la mejor variante de la matriz "calculated" y la mejor de la matriz "distance".' }
          ],
          correctOptionId: 'c'
        }
      ]
    }
  },
  {
    title: 'Precio Sugerido y Publicacion',
    order: 4,
    content: `
      <h2>Precio Sugerido y Publicacion de Rutas</h2>
      <p>
        Una vez que la ruta esta optimizada, el sistema calcula un <strong>precio sugerido</strong> basado en
        los costos operativos estimados. Este precio sirve como referencia para el operador, quien puede
        aceptarlo o modificarlo antes de publicar la ruta en SyncFlex.
      </p>

      <h3>Formula del Precio Sugerido</h3>
      <p>El precio sugerido se calcula con la siguiente formula:</p>
      <pre><code>Precio Sugerido = (Costo de Combustible + Costo de Mano de Obra) x (1 + Margen%)</code></pre>

      <h3>Componentes del Calculo</h3>

      <p><strong>Costo de Combustible:</strong></p>
      <pre><code>Costo Combustible = (distancia_millas / mpg) x precio_por_galon</code></pre>
      <p>Donde <code>mpg</code> es millas por galon (rendimiento del vehiculo).</p>

      <p><strong>Costo de Mano de Obra:</strong></p>
      <pre><code>Costo Mano de Obra = tiempo_total_horas x tarifa_por_hora</code></pre>

      <p><strong>Tiempo Total:</strong></p>
      <pre><code>Tiempo Total = tiempo_de_manejo + tiempo_en_paradas</code></pre>
      <ul>
        <li><strong>Tiempo de manejo:</strong> <code>distancia_millas / velocidad_promedio</code></li>
        <li><strong>Tiempo en paradas:</strong> <code>(numero_paradas x minutos_por_parada) / 60</code></li>
      </ul>

      <h3>Valores Predeterminados</h3>
      <table>
        <thead>
          <tr>
            <th>Parametro</th>
            <th>Valor predeterminado</th>
            <th>Descripcion</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>mpg</strong></td>
            <td>12</td>
            <td>Millas por galon (rendimiento de combustible del vehiculo)</td>
          </tr>
          <tr>
            <td><strong>Tarifa por hora</strong></td>
            <td>$18/hr</td>
            <td>Costo laboral del conductor por hora</td>
          </tr>
          <tr>
            <td><strong>Margen</strong></td>
            <td>20%</td>
            <td>Porcentaje de margen sobre el costo base</td>
          </tr>
          <tr>
            <td><strong>Velocidad promedio</strong></td>
            <td>30 mph</td>
            <td>Velocidad promedio estimada durante la ruta</td>
          </tr>
          <tr>
            <td><strong>Tiempo por parada</strong></td>
            <td>5 minutos</td>
            <td>Tiempo estimado en cada punto de entrega</td>
          </tr>
          <tr>
            <td><strong>Precio de combustible</strong></td>
            <td>Obtenido de EIA API</td>
            <td>Precio actualizado del galon de diesel desde la API de la Administracion de Informacion Energetica (EIA)</td>
          </tr>
        </tbody>
      </table>

      <h3>Ejemplo de Calculo</h3>
      <p>Consideremos una ruta con: <strong>15 paradas</strong>, <strong>45 millas</strong> de distancia total, precio del diesel <strong>$3.50/galon</strong>:</p>

      <table>
        <thead>
          <tr>
            <th>Concepto</th>
            <th>Calculo</th>
            <th>Resultado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Combustible</td>
            <td>(45 / 12) x $3.50</td>
            <td>$13.13</td>
          </tr>
          <tr>
            <td>Tiempo de manejo</td>
            <td>45 / 30</td>
            <td>1.5 horas</td>
          </tr>
          <tr>
            <td>Tiempo en paradas</td>
            <td>(15 x 5) / 60</td>
            <td>1.25 horas</td>
          </tr>
          <tr>
            <td>Mano de obra</td>
            <td>(1.5 + 1.25) x $18</td>
            <td>$49.50</td>
          </tr>
          <tr>
            <td>Subtotal</td>
            <td>$13.13 + $49.50</td>
            <td>$62.63</td>
          </tr>
          <tr>
            <td><strong>Precio sugerido</strong></td>
            <td>$62.63 x 1.20</td>
            <td><strong>$75.15</strong></td>
          </tr>
        </tbody>
      </table>

      <div class="callout">
        <strong>Nota:</strong> El operador puede aceptar el precio sugerido o modificarlo segun su criterio.
        Todos los cambios de precio quedan registrados en un historial de precios (price history) para
        trazabilidad y auditoria.
      </div>

      <h3>Flujo de Publicacion</h3>
      <p>El proceso de publicacion de una ruta sigue estos pasos:</p>
      <ol>
        <li><strong>Revision:</strong> El operador revisa la ruta optimizada, confirma el precio y define la ventana de llegada del conductor (<code>driverArrivalInterval</code>), que indica el rango horario en que el conductor debe presentarse en el warehouse.</li>
        <li><strong>Publicacion:</strong> Al publicar (<code>published: true</code>), la ruta pasa al estado <code>READY_TO_ASSIGN</code>.</li>
        <li><strong>Creacion en SyncFlex:</strong> La ruta se crea en la organizacion SyncFlex con una referencia al <code>ownerOrgId</code> (la organizacion que la publico).</li>
        <li><strong>Transferencia:</strong> La ruta se elimina de la organizacion original y pasa a vivir en SyncFlex, donde los conductores pueden verla.</li>
      </ol>

      <div class="callout warning">
        <strong>Requisitos para publicar:</strong> La ruta debe tener un precio definido y una ventana de llegada
        del conductor (<code>driverArrivalInterval</code>). Sin estos dos elementos, no es posible publicar la ruta.
      </div>

      <h3>Asignacion de Conductor</h3>
      <p>Una vez publicada en SyncFlex, la asignacion del conductor sigue este flujo:</p>
      <ol>
        <li>Los conductores registrados en SyncFlex visualizan las rutas disponibles.</li>
        <li>Un conductor selecciona y acepta una ruta.</li>
        <li>La ruta pasa a estado <code>ASSIGNED</code>, registrando la informacion del conductor: nombre, email y timestamp de aceptacion.</li>
      </ol>

      <p>
        La asignacion es <strong>atomica</strong>: si dos conductores intentan aceptar la misma ruta
        simultaneamente, solo uno de ellos lo lograra. Esto previene conflictos y garantiza que cada
        ruta se asigne a un unico conductor.
      </p>
    `,
    test: {
      questions: [
        {
          id: 'c6l4q1',
          question: 'Cual es la formula del precio sugerido?',
          options: [
            { id: 'a', text: 'Distancia x Precio por milla', explanation: 'Esta formula solo considera la distancia. El precio sugerido incluye tanto el costo de combustible como el de mano de obra, mas un margen porcentual.' },
            { id: 'b', text: '(Costo Combustible + Costo Mano de Obra) x (1 + Margen%)' },
            { id: 'c', text: 'Numero de paradas x Precio por parada', explanation: 'El precio no se calcula por parada. Se basa en la suma del costo de combustible y mano de obra, multiplicada por un margen.' },
            { id: 'd', text: 'Tiempo total x Tarifa por hora', explanation: 'Esta formula solo cubre la mano de obra. El precio sugerido tambien incluye el costo de combustible y un margen porcentual sobre ambos.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c6l4q4',
          question: 'Que es el driverArrivalInterval?',
          options: [
            { id: 'a', text: 'El tiempo estimado de cada entrega', explanation: 'El tiempo estimado por entrega es el parametro "minutos por parada" (5 min por defecto). El driverArrivalInterval define cuando debe llegar el conductor al warehouse.' },
            { id: 'b', text: 'La velocidad promedio del conductor', explanation: 'La velocidad promedio es un parametro aparte (30 mph por defecto). El driverArrivalInterval es la ventana horaria de llegada del conductor al warehouse.' },
            { id: 'c', text: 'La ventana horaria en que el conductor debe presentarse en el warehouse' },
            { id: 'd', text: 'El intervalo entre paradas de la ruta', explanation: 'El intervalo entre paradas depende de la distancia y velocidad. El driverArrivalInterval es el rango horario en que el conductor debe presentarse en el warehouse.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c6l4q5',
          question: 'Que sucede con la ruta cuando se publica en SyncFlex?',
          options: [
            { id: 'a', text: 'Se duplica en ambas organizaciones', explanation: 'La ruta no se duplica. Se transfiere completamente a SyncFlex y se elimina de la organizacion original, manteniendo solo la referencia ownerOrgId.' },
            { id: 'b', text: 'Se elimina de la organizacion original y pasa a vivir en SyncFlex' },
            { id: 'c', text: 'Solo se muestra un enlace en SyncFlex', explanation: 'No es un simple enlace. La ruta se crea completamente en SyncFlex y se elimina de la organizacion original como parte del proceso de transferencia.' },
            { id: 'd', text: 'Se archiva en la organizacion original', explanation: 'La ruta no se archiva sino que se elimina de la organizacion original. Pasa a vivir en SyncFlex con una referencia al ownerOrgId para trazabilidad.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c6l4q6',
          question: 'Que significa que la asignacion de conductor sea "atomica"?',
          options: [
            { id: 'a', text: 'Que el conductor no puede rechazar la ruta despues de aceptarla', explanation: 'La atomicidad no se refiere a la irrevocabilidad de la aceptacion. Significa que ante intentos simultaneos de aceptacion, solo un conductor lo logra.' },
            { id: 'b', text: 'Que si dos conductores intentan aceptar simultaneamente, solo uno lo logra' },
            { id: 'c', text: 'Que la asignacion se realiza automaticamente sin intervencion humana', explanation: 'La atomicidad no significa automatizacion. Los conductores eligen manualmente las rutas; la atomicidad garantiza que no haya doble asignacion en caso de accesos simultaneos.' },
            { id: 'd', text: 'Que el conductor debe completar la ruta en un tiempo limitado', explanation: 'La atomicidad no se refiere a limites de tiempo para completar la ruta. Se refiere a que la operacion de aceptacion previene conflictos cuando dos conductores intentan aceptar la misma ruta.' }
          ],
          correctOptionId: 'b'
        }
      ]
    }
  },
  {
    title: 'Despacho, Entrega y Cancelacion',
    order: 5,
    content: `
      <h2>Despacho, Entrega y Cancelacion</h2>
      <p>
        Esta leccion cubre las etapas finales del flujo de Flex Routes: el despacho de paquetes al conductor,
        el proceso de entrega durante la ruta, la finalizacion, y las reglas de cancelacion.
      </p>

      <h3>Proceso de Despacho</h3>
      <p>
        El despacho se realiza mediante <strong>escaneo masivo</strong> (<code>dispatchFlexRoute</code>) cuando
        el conductor llega al warehouse. El proceso sigue estos pasos:
      </p>
      <ol>
        <li><strong>Escaneo de paquetes:</strong> Se escanean todos los paquetes que el conductor va a llevar, verificando que coincidan con los asignados a la ruta.</li>
        <li><strong>Reporte de discrepancias:</strong> Si hay paquetes faltantes, danados o incorrectos, se reportan las discrepancias.</li>
        <li><strong>Decision sobre paquetes problematicos:</strong> Para cada paquete con discrepancia, el operador decide si devolverlo al warehouse o continuar con el conductor.</li>
        <li><strong>Completar despacho:</strong> La ruta pasa a estado <code>IN_PROGRESS</code> y los envios se marcan como <code>out_for_delivery</code>.</li>
        <li><strong>Re-optimizacion automatica:</strong> Si se devuelven paquetes al warehouse, la ruta se re-optimiza automaticamente con los paquetes restantes para mantener el orden optimo de paradas.</li>
      </ol>

      <div class="callout">
        <strong>Punto clave:</strong> La re-optimizacion automatica despues de retirar paquetes es fundamental
        para mantener la eficiencia de la ruta. Si se eliminan paradas intermedias, el orden original podria
        no ser optimo con las paradas restantes.
      </div>

      <h3>Durante la Ruta</h3>
      <p>Una vez despachada la ruta, el conductor utiliza la aplicacion movil para ejecutar las entregas:</p>
      <ul>
        <li><strong>Navegacion:</strong> La app guia al conductor entre las paradas en el orden optimizado.</li>
        <li><strong>Estados de cada parada:</strong> Cada parada tiene dos posibles estados:
          <ul>
            <li><code>not_delivered</code> (pendiente): La entrega aun no se ha realizado.</li>
            <li><code>delivered</code> (entregado): La entrega se completo exitosamente.</li>
          </ul>
        </li>
        <li><strong>Prueba de entrega (POD):</strong> Al completar una entrega, el conductor registra la prueba de entrega, que puede incluir fotografias, firma del destinatario y otros comprobantes.</li>
      </ul>

      <h3>Finalizacion de la Ruta</h3>
      <p>La finalizacion ocurre cuando se completan todas las entregas o se procesan todos los paquetes:</p>
      <ul>
        <li>La ruta pasa a estado <code>COMPLETED</code>.</li>
        <li>Se registra la informacion de finalizacion: <code>completedAt</code> (timestamp de finalizacion), estadisticas de entrega y ganancias del conductor.</li>
        <li>Los paquetes no entregados pasan por el proceso de <strong>Retorno al Warehouse</strong>, donde la ruta entra en estado <code>RETURN_TO_WAREHOUSE</code> hasta que los paquetes son devueltos fisicamente.</li>
      </ul>

      <h3>Retorno al Warehouse</h3>
      <p>
        Cuando hay paquetes que no pudieron ser entregados, la ruta entra en estado <code>RETURN_TO_WAREHOUSE</code>.
        El conductor regresa al warehouse con estos paquetes, donde son recibidos y escaneados. Una vez completado
        el retorno, la ruta pasa a <code>COMPLETED</code>. Los paquetes devueltos quedan disponibles para ser
        incluidos en otra ruta futura.
      </p>

      <h3>Reglas de Cancelacion</h3>
      <p>La cancelacion de una flex route esta sujeta a reglas estrictas dependiendo de su estado actual:</p>

      <table>
        <thead>
          <tr>
            <th>Estado</th>
            <th>Se puede cancelar</th>
            <th>Motivo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>CREATED</code></td>
            <td>Si</td>
            <td>La ruta aun no ha sido optimizada ni publicada.</td>
          </tr>
          <tr>
            <td><code>OPTIMIZED</code></td>
            <td>Si</td>
            <td>La ruta esta optimizada pero no publicada.</td>
          </tr>
          <tr>
            <td><code>PENDING_SELECTION</code></td>
            <td>Si</td>
            <td>El operador aun no ha elegido la variante de ruta.</td>
          </tr>
          <tr>
            <td><code>FAILED_OPTIMIZATION</code></td>
            <td>Si</td>
            <td>La optimizacion fallo y la ruta no se puede procesar.</td>
          </tr>
          <tr>
            <td><code>READY_TO_ASSIGN</code></td>
            <td>Si</td>
            <td>La ruta esta publicada pero ningun conductor la ha aceptado.</td>
          </tr>
          <tr>
            <td><code>ASSIGNED</code></td>
            <td>No</td>
            <td>Ya hay un conductor asignado. Cancelar afectaria al conductor.</td>
          </tr>
          <tr>
            <td><code>IN_PROGRESS</code></td>
            <td>No</td>
            <td>El conductor esta en ruta realizando entregas.</td>
          </tr>
          <tr>
            <td><code>COMPLETED</code></td>
            <td>No</td>
            <td>La ruta ya finalizo.</td>
          </tr>
        </tbody>
      </table>

      <h3>Proceso de Cancelacion</h3>
      <p>Cuando se cancela una ruta, el sistema ejecuta las siguientes acciones:</p>
      <ol>
        <li><strong>Validacion de propietario:</strong> Se verifica que quien cancela sea el propietario de la ruta (via <code>ownerOrgId</code> o <code>ownerUserId</code>).</li>
        <li><strong>Limpieza de referencias:</strong> Se eliminan todas las referencias a la flex route de los envios asociados, liberandolos.</li>
        <li><strong>Actualizacion de estado:</strong> La ruta pasa a estado <code>CANCELLED</code> con registro del timestamp y motivo de cancelacion.</li>
        <li><strong>Liberacion de envios:</strong> Los envios quedan disponibles para ser incluidos en otra ruta.</li>
      </ol>

      <div class="callout warning">
        <strong>Importante:</strong> La cancelacion es irreversible. Una vez cancelada, la ruta no puede
        reactivarse. Los envios asociados deben incluirse en un nuevo round si se desean entregar.
      </div>

      <h3>SyncFlex como Organizacion Central</h3>
      <p>SyncFlex actua como el punto central de conexion entre organizaciones y conductores:</p>
      <ul>
        <li><strong>Publicacion:</strong> Las organizaciones publican sus rutas en SyncFlex, donde quedan disponibles para los conductores.</li>
        <li><strong>Visibilidad:</strong> Los conductores registrados en SyncFlex pueden ver y aceptar rutas de cualquier organizacion que haya publicado.</li>
        <li><strong>Replicacion de envios:</strong> Durante el despacho, los envios se replican entre la organizacion de origen y SyncFlex, manteniendo sincronizada la informacion.</li>
        <li><strong>Trazabilidad:</strong> Cada ruta en SyncFlex tiene un campo <code>ownerOrgId</code> que indica la organizacion que la publico, permitiendo la trazabilidad completa.</li>
      </ul>
    `,
    test: {
      questions: [
        {
          id: 'c6l5q1',
          question: 'Que sucede si se devuelven paquetes al warehouse durante el despacho?',
          options: [
            { id: 'a', text: 'La ruta se cancela automaticamente', explanation: 'La ruta no se cancela al devolver paquetes. Se re-optimiza automaticamente con los paquetes restantes para mantener un orden de paradas eficiente.' },
            { id: 'b', text: 'La ruta se re-optimiza automaticamente con los paquetes restantes' },
            { id: 'c', text: 'El conductor debe entregar todos los paquetes sin excepcion', explanation: 'El operador puede decidir devolver paquetes problematicos al warehouse. La ruta se re-optimiza con los paquetes restantes.' },
            { id: 'd', text: 'Se crea una nueva ruta para los paquetes devueltos', explanation: 'No se crea una ruta nueva automaticamente para los paquetes devueltos. La ruta existente se re-optimiza con los paquetes restantes; los devueltos quedan disponibles para rutas futuras.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c6l5q2',
          question: 'Cuales son los dos posibles estados de una parada durante la ruta?',
          options: [
            { id: 'a', text: 'pending y completed', explanation: 'Estos nombres no son los estados correctos de una parada. Los estados definidos en el sistema son not_delivered (pendiente) y delivered (entregado).' },
            { id: 'b', text: 'not_delivered y delivered' },
            { id: 'c', text: 'active y inactive', explanation: 'Estos nombres no corresponden a estados de parada en el sistema. Los estados correctos son not_delivered y delivered.' },
            { id: 'd', text: 'scheduled y finished', explanation: 'Estos nombres no son estados validos de parada. El sistema usa not_delivered (pendiente de entrega) y delivered (entrega completada).' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c6l5q3',
          question: 'Desde cual de estos estados se puede cancelar una flex route?',
          options: [
            { id: 'a', text: 'ASSIGNED', explanation: 'Desde ASSIGNED no se puede cancelar porque ya hay un conductor asignado y la cancelacion lo afectaria directamente.' },
            { id: 'b', text: 'IN_PROGRESS', explanation: 'Desde IN_PROGRESS no se puede cancelar porque el conductor ya esta en ruta realizando entregas.' },
            { id: 'c', text: 'READY_TO_ASSIGN' },
            { id: 'd', text: 'COMPLETED', explanation: 'Desde COMPLETED no se puede cancelar porque la ruta ya finalizo y todas las entregas fueron procesadas.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c6l5q4',
          question: 'Que ocurre con los envios cuando se cancela una ruta?',
          options: [
            { id: 'a', text: 'Se eliminan permanentemente del sistema', explanation: 'Los envios no se eliminan del sistema al cancelar una ruta. Se liberan de la referencia a la flex route y quedan disponibles para incluirse en otra ruta.' },
            { id: 'b', text: 'Se marcan como entregados', explanation: 'Cancelar una ruta no marca los envios como entregados. Se eliminan las referencias a la flex route y los envios quedan libres para otra ruta.' },
            { id: 'c', text: 'Se liberan y quedan disponibles para ser incluidos en otra ruta' },
            { id: 'd', text: 'Se devuelven automaticamente al remitente', explanation: 'No hay un proceso automatico de devolucion al remitente al cancelar. Los envios se liberan y quedan disponibles para ser incluidos en un nuevo round.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c6l5q5',
          question: 'Que es el POD que registra el conductor al completar una entrega?',
          options: [
            { id: 'a', text: 'Un codigo de descuento para el cliente', explanation: 'POD no es un codigo de descuento. Significa Proof of Delivery (prueba de entrega) e incluye fotografias, firma del destinatario y otros comprobantes.' },
            { id: 'b', text: 'La prueba de entrega (Proof of Delivery): fotos, firma y otros comprobantes' },
            { id: 'c', text: 'Un reporte de incidencias en la ruta', explanation: 'POD no es un reporte de incidencias. Es la prueba de entrega (Proof of Delivery) que documenta que el paquete fue entregado exitosamente.' },
            { id: 'd', text: 'El calculo del precio final de la entrega', explanation: 'POD no se relaciona con el precio. Es la prueba de entrega (Proof of Delivery) que el conductor registra con fotos y firma al completar cada entrega.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c6l5q6',
          question: 'Que indica el campo ownerOrgId en una ruta de SyncFlex?',
          options: [
            { id: 'a', text: 'El conductor asignado a la ruta', explanation: 'ownerOrgId no identifica al conductor. La informacion del conductor se registra al aceptar la ruta. ownerOrgId indica la organizacion que publico la ruta.' },
            { id: 'b', text: 'La organizacion que publico la ruta' },
            { id: 'c', text: 'El warehouse de destino', explanation: 'ownerOrgId no indica el warehouse de destino. Identifica la organizacion que publico la ruta en SyncFlex para mantener la trazabilidad.' },
            { id: 'd', text: 'El precio de la ruta', explanation: 'ownerOrgId no se relaciona con el precio. Es un campo de trazabilidad que identifica cual organizacion publico la ruta en SyncFlex.' }
          ],
          correctOptionId: 'b'
        },
        {
          id: 'c6l5q7',
          question: 'Que estado tiene la ruta cuando el conductor regresa con paquetes no entregados?',
          options: [
            { id: 'a', text: 'COMPLETED', explanation: 'COMPLETED es el estado final despues de que todos los paquetes han sido procesados y el conductor ha regresado. Mientras regresa con paquetes pendientes, el estado es RETURN_TO_WAREHOUSE.' },
            { id: 'b', text: 'CANCELLED', explanation: 'CANCELLED se usa cuando se cancela una ruta antes de la entrega. Cuando el conductor regresa con paquetes no entregados, el estado es RETURN_TO_WAREHOUSE.' },
            { id: 'c', text: 'RETURN_TO_WAREHOUSE' },
            { id: 'd', text: 'FAILED', explanation: 'FAILED no es un estado valido en el ciclo de vida de una flex route. El estado correcto para el retorno con paquetes pendientes es RETURN_TO_WAREHOUSE.' }
          ],
          correctOptionId: 'c'
        },
        {
          id: 'c6l5q8',
          question: 'Por que no se puede cancelar una ruta en estado ASSIGNED?',
          options: [
            { id: 'a', text: 'Porque la ruta ya esta optimizada', explanation: 'Tener la ruta optimizada no impide la cancelacion. De hecho, desde el estado OPTIMIZED si se puede cancelar. La razon es que en ASSIGNED ya hay un conductor comprometido.' },
            { id: 'b', text: 'Porque ya hay un conductor asignado y cancelar lo afectaria' },
            { id: 'c', text: 'Porque el precio ya fue definido', explanation: 'Tener precio definido no impide la cancelacion. Desde READY_TO_ASSIGN (que ya tiene precio) si se puede cancelar. En ASSIGNED no se puede porque hay un conductor comprometido.' },
            { id: 'd', text: 'Porque los paquetes ya fueron escaneados', explanation: 'El escaneo de paquetes ocurre durante el despacho, no al asignar conductor. En ASSIGNED no se puede cancelar porque ya hay un conductor asignado que seria afectado.' }
          ],
          correctOptionId: 'b'
        }
      ]
    }
  }
];
