import { useState, useEffect } from 'react';
import {
  subscribeToAllRequests,
  approveRequest,
  rejectRequest
} from '../services/requestService';
import Icon from '../components/common/Icon';
import Table from '../components/tables/Table';
import TableActions from '../components/tables/TableActions';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Toast from '../components/common/Toast';

const Solicitudes = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null, request: null });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let isSubscribed = true;

    const unsubscribe = subscribeToAllRequests((fetchedRequests) => {
      if (isSubscribed) {
        setRequests(fetchedRequests);
        setLoading(false);
      }
    });

    const timeout = setTimeout(() => {
      if (isSubscribed) {
        setLoading(false);
      }
    }, 3000);

    return () => {
      isSubscribed = false;
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleApprove = (request) => {
    setConfirmDialog({ isOpen: true, type: 'approve', request });
  };

  const handleReject = (request) => {
    setConfirmDialog({ isOpen: true, type: 'reject', request });
  };

  const confirmAction = async () => {
    const { type, request } = confirmDialog;
    setConfirmDialog({ isOpen: false, type: null, request: null });

    if (type === 'approve') {
      const result = await approveRequest(request);
      if (result.success) {
        setToast({ message: 'Solicitud aprobada. Story Points actualizados.', type: 'success' });
      } else {
        setToast({ message: 'Error al aprobar: ' + result.error, type: 'error' });
      }
    } else if (type === 'reject') {
      const result = await rejectRequest(request);
      if (result.success) {
        setToast({ message: 'Solicitud rechazada.', type: 'success' });
      } else {
        setToast({ message: 'Error al rechazar: ' + result.error, type: 'error' });
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="page-container page-container-narrow">
        <div className="empty-state">
          <div className="spinner"></div>
          <p>Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  const columns = [
    { key: 'taskTitle', label: 'Tarea', width: '22%' },
    { key: 'requestedByName', label: 'Solicitado por', width: '16%' },
    { key: 'currentStoryPoints', label: 'SP Actual', width: '10%', align: 'center' },
    { key: 'requestedStoryPoints', label: 'SP Solicitado', width: '10%', align: 'center' },
    { key: 'reason', label: 'Razon', width: '22%' },
    { key: 'createdAt', label: 'Fecha', width: '12%' },
    { key: 'actions', label: 'Acciones', width: '8%', align: 'right', filterable: false, sticky: 'right' }
  ];

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.type === 'approve' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
        message={
          confirmDialog.type === 'approve'
            ? `Aprobar el cambio de Story Points de "${confirmDialog.request?.taskTitle}" de ${confirmDialog.request?.currentStoryPoints ?? 'Sin asignar'} a ${confirmDialog.request?.requestedStoryPoints}?`
            : `Rechazar la solicitud de cambio de Story Points para "${confirmDialog.request?.taskTitle}"?`
        }
        confirmText={confirmDialog.type === 'approve' ? 'Aprobar' : 'Rechazar'}
        cancelText="Cancelar"
        confirmVariant={confirmDialog.type === 'approve' ? 'primary' : 'danger'}
        onConfirm={confirmAction}
        onCancel={() => setConfirmDialog({ isOpen: false, type: null, request: null })}
      />

      <div className="page-container page-container-narrow">
        <div className="page-header">
          <div>
            <h1 className="heading-1 text-primary flex items-center gap-sm mb-xs">
              <Icon name="inbox" size={24} />
              Solicitudes
            </h1>
            <p className="text-base text-secondary">
              Solicitudes pendientes
              {' '} — <strong className="text-primary">{requests.length}</strong> pendiente{requests.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <Table
          showFilters={true}
          searchPlaceholder="Buscar solicitudes..."
          columns={columns}
          data={requests}
          renderCell={(request, column) => {
            switch (column.key) {
              case 'taskTitle':
                return <span className="font-medium">{request.taskTitle}</span>;
              case 'requestedByName':
                return <span className="text-sm">{request.requestedByName}</span>;
              case 'currentStoryPoints':
                return <span>{request.currentStoryPoints ?? '-'}</span>;
              case 'requestedStoryPoints':
                return <strong>{request.requestedStoryPoints}</strong>;
              case 'reason':
                return (
                  <span className="text-sm text-secondary" title={request.reason}>
                    {request.reason.length > 60 ? request.reason.substring(0, 60) + '...' : request.reason}
                  </span>
                );
              case 'createdAt':
                return <span className="text-sm">{formatDate(request.createdAt)}</span>;
              case 'actions':
                return (
                  <TableActions
                    rowData={request}
                    actions={[
                      {
                        name: 'approve',
                        icon: 'check',
                        label: 'Aprobar',
                        onClick: (r) => handleApprove(r),
                        variant: 'ghost',
                        title: 'Aprobar solicitud'
                      },
                      {
                        name: 'reject',
                        icon: 'x',
                        label: 'Rechazar',
                        onClick: (r) => handleReject(r),
                        variant: 'ghost',
                        title: 'Rechazar solicitud'
                      }
                    ]}
                    size="small"
                    layout="horizontal"
                  />
                );
              default:
                return undefined;
            }
          }}
          emptyMessage="No hay solicitudes pendientes"
          hoverable={true}
        />
      </div>
    </>
  );
};

export default Solicitudes;

