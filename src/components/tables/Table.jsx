import { useState } from 'react';
import Icon from '../common/Icon';
import '../../styles/Table.css';

/**
 * Componente genérico de tabla reutilizable con filtros integrados
 *
 * @param {Object} props
 * @param {Array} props.columns - Array de definiciones de columnas
 *   Ejemplo: [{ key: 'name', label: 'Nombre', width: '200px', filterable: true }]
 * @param {Array} props.data - Array de datos a mostrar
 * @param {Function} props.renderCell - Función opcional para renderizar celdas personalizadas
 * @param {Function} props.onRowClick - Función opcional cuando se hace clic en una fila
 * @param {String} props.emptyMessage - Mensaje cuando no hay datos
 * @param {Boolean} props.loading - Estado de carga
 * @param {String} props.className - Clase CSS adicional
 * @param {Boolean} props.hoverable - Habilitar hover en filas (default: true)
 * @param {Boolean} props.striped - Filas alternadas (default: false)
 * @param {Boolean} props.showFilters - Mostrar barra de filtros (default: false)
 * @param {String} props.searchPlaceholder - Placeholder para búsqueda global
 */
const Table = ({
  columns = [],
  data = [],
  renderCell,
  onRowClick,
  emptyMessage = 'No hay datos disponibles',
  loading = false,
  className = '',
  hoverable = true,
  striped = false,
  showFilters = false,
  searchPlaceholder = 'Buscar...'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [showFilterRow, setShowFilterRow] = useState(false);

  // Filtrar datos
  const filteredData = data.filter(row => {
    // Filtro de búsqueda global
    if (searchTerm && showFilters) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = columns.some(column => {
        const value = row[column.key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchLower);
      });
      if (!matchesSearch) return false;
    }

    // Filtros por columna
    for (const [key, filterValue] of Object.entries(columnFilters)) {
      if (!filterValue) continue;

      const column = columns.find(col => col.key === key);
      if (!column) continue;

      const rowValue = row[key];

      // Si la columna tiene opciones de filtro (dropdown)
      if (column.filterOptions) {
        if (filterValue === 'all') continue;
        if (rowValue !== filterValue) return false;
      } else {
        // Filtro de texto
        if (rowValue === null || rowValue === undefined) return false;
        if (!String(rowValue).toLowerCase().includes(filterValue.toLowerCase())) {
          return false;
        }
      }
    }

    return true;
  });

  // Manejar cambio de filtro de columna
  const handleColumnFilterChange = (columnKey, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
  };

  // Limpiar todos los filtros
  const clearFilters = () => {
    setSearchTerm('');
    setColumnFilters({});
  };

  // Renderizar celda individual
  const renderTableCell = (row, column) => {
    // Si hay una función de renderizado personalizado, usarla
    if (renderCell) {
      const customContent = renderCell(row, column);
      if (customContent !== undefined) {
        return customContent;
      }
    }

    // Renderizado por defecto: obtener valor del objeto
    const value = row[column.key];

    // Si la columna tiene un formateador, usarlo
    if (column.format) {
      return column.format(value, row);
    }

    // Renderizado por defecto
    if (value === null || value === undefined) {
      return <span className="table-cell-empty">-</span>;
    }

    return value;
  };

  // Obtener alineación de columna
  const getColumnAlign = (column) => {
    return column.align || 'left';
  };

  // Clases CSS para la tabla
  const tableClasses = [
    'generic-table',
    hoverable && 'table-hoverable',
    striped && 'table-striped',
    className
  ].filter(Boolean).join(' ');

  if (loading) {
    return (
      <div className="table-container">
        <div className="table-loading">
          <div className="loading-spinner"></div>
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }

  const hasActiveFilters = searchTerm || Object.values(columnFilters).some(v => v && v !== 'all');

  return (
    <div className="table-container">
      {showFilters && (
        <div className="table-filters-bar">
          <div className="table-search">
            <Icon name="search" size={18} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="table-search-input"
            />
          </div>
          <div className="table-filter-actions">
            <button
              onClick={() => setShowFilterRow(!showFilterRow)}
              className={`btn-filter-toggle ${showFilterRow ? 'active' : ''}`}
              title="Filtros por columna"
            >
              <Icon name="filter" size={16} />
              <span>Filtros</span>
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn-clear-filters"
                title="Limpiar filtros"
              >
                <Icon name="x" size={16} />
                <span>Limpiar</span>
              </button>
            )}
            <span className="table-results-count">
              {filteredData.length} de {data.length}
            </span>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table className={tableClasses}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                    textAlign: getColumnAlign(column)
                  }}
                  className={column.headerClassName}
                >
                  {column.label}
                </th>
              ))}
            </tr>
            {showFilterRow && showFilters && (
              <tr className="table-filter-row">
                {columns.map((column) => (
                  <th key={`filter-${column.key}`} className="table-filter-cell">
                    {column.filterable !== false && (
                      column.filterOptions ? (
                        <select
                          value={columnFilters[column.key] || 'all'}
                          onChange={(e) => handleColumnFilterChange(column.key, e.target.value)}
                          className="table-filter-select"
                        >
                          <option value="all">Todos</option>
                          {column.filterOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder={`Filtrar ${column.label.toLowerCase()}...`}
                          value={columnFilters[column.key] || ''}
                          onChange={(e) => handleColumnFilterChange(column.key, e.target.value)}
                          className="table-filter-input"
                        />
                      )
                    )}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="table-empty">
                  {hasActiveFilters ? 'No se encontraron resultados' : emptyMessage}
                </td>
              </tr>
            ) : (
              filteredData.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={onRowClick ? 'table-row-clickable' : ''}
                >
                  {columns.map((column) => (
                    <td
                      key={`${row.id || rowIndex}-${column.key}`}
                      style={{ textAlign: getColumnAlign(column) }}
                      className={column.cellClassName}
                    >
                      {renderTableCell(row, column)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
