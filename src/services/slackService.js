const SLACK_WEBHOOK_URL = import.meta.env.VITE_SLACK_WEBHOOK_URL;

/**
 * Enviar notificacion a Slack cuando una tarea se mueve a QA
 * @param {Object} params
 * @param {string} params.taskTitle - Titulo de la tarea
 * @param {string} params.demoUrl - URL del demo
 * @param {string} params.movedBy - Nombre del usuario que movio la tarea
 * @returns {Object} - { success: boolean, error?: string }
 */
export const sendQaNotification = async ({ taskTitle, demoUrl, movedBy }) => {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('Slack webhook URL no configurada. Agrega VITE_SLACK_WEBHOOK_URL al archivo .env');
    return { success: true };
  }

  try {
    const payload = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'Nueva tarea en QA',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Tarea:*\n${taskTitle}`
            },
            {
              type: 'mrkdwn',
              text: `*Movida por:*\n${movedBy}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Demo:* <${demoUrl}|Ver demo>`
          }
        }
      ]
    };

    // mode: 'no-cors' is required because Slack webhooks don't support CORS
    // from browser-side requests. The request still goes through, but the
    // response is opaque (we can't read the status code).
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return { success: true };
  } catch (error) {
    console.error('Error al enviar notificacion a Slack:', error);
    return { success: false, error: error.message };
  }
};
