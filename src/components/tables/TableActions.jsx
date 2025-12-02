import Icon from '../common/Icon';
import '../../styles/TableActions.css';

/**
 * Componente genérico para acciones de filas en tablas
 *
 * @param {Object} props
 * @param {Array} props.actions - Array de acciones a mostrar
 *   Ejemplo: [{
 *     name: 'edit',
 *     icon: 'edit',
 *     label: 'Editar',
 *     onClick: (rowData) => handleEdit(rowData),
 *     variant: 'primary', // 'primary', 'secondary', 'danger', 'success'
 *     disabled: false,
 *     title: 'Editar este elemento'
 *   }]
 * @param {Object} props.rowData - Datos de la fila actual
 * @param {String} props.layout - 'horizontal' o 'vertical' (default: 'horizontal')
 * @param {String} props.size - 'small', 'medium', 'large' (default: 'medium')
 * @param {Boolean} props.showLabels - Mostrar texto de las acciones (default: false para iconos compactos)
 */
const TableActions = ({
  actions = [],
  rowData,
  layout = 'horizontal',
  size = 'medium',
  showLabels = false
}) => {

  const handleActionClick = (action, e) => {
    e.stopPropagation(); // Evitar que se propague al onClick de la fila

    if (action.disabled) return;

    if (action.onClick) {
      action.onClick(rowData);
    }
  };

  const getActionClass = (action) => {
    const classes = ['table-action-btn'];

    // Variante
    if (action.variant) {
      classes.push(`table-action-${action.variant}`);
    } else {
      classes.push('table-action-secondary');
    }

    // Tamaño
    classes.push(`table-action-${size}`);

    // Modo solo icono
    if (!showLabels) {
      classes.push('table-action-icon-only');
    }

    // Disabled
    if (action.disabled) {
      classes.push('table-action-disabled');
    }

    return classes.join(' ');
  };

  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div className={`table-actions-container flex items-center gap-sm table-actions-${layout}`}>
      {actions.map((action, index) => (
        <button
          key={action.name || index}
          onClick={(e) => handleActionClick(action, e)}
          className={getActionClass(action)}
          disabled={action.disabled}
          title={action.title || action.label}
          aria-label={action.label}
        >
          {action.icon && (
            <Icon
              name={action.icon}
              size={size === 'small' ? 14 : size === 'large' ? 18 : 16}
            />
          )}
          {showLabels && action.label && (
            <span className="table-action-label">{action.label}</span>
          )}
        </button>
      ))}
    </div>
  );
};

export default TableActions;
