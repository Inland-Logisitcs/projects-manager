import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeToCourses, subscribeToCourseProgress, seedAllCourses, seedCourse } from '../services/courseService';
import { allCourses } from '../data/courses';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/common/Icon';
import Toast from '../components/common/Toast';
import '../styles/Courses.css';

const PROGRESS_RING_RADIUS = 15;
const PROGRESS_RING_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RING_RADIUS;

const Courses = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState('');
  const [toast, setToast] = useState(null);
  const [seedingCourseId, setSeedingCourseId] = useState(null);
  const [confirmReseed, setConfirmReseed] = useState(null);

  useEffect(() => {
    const unsubscribeCourses = subscribeToCourses((fetchedCourses) => {
      setCourses(fetchedCourses);
      setLoading(false);
    });

    let unsubscribeProgress = () => {};
    if (user) {
      unsubscribeProgress = subscribeToCourseProgress(user.uid, (progressMap) => {
        setProgress(progressMap);
      });
    }

    return () => {
      unsubscribeCourses();
      unsubscribeProgress();
    };
  }, [user]);

  const handleSeedCourses = async () => {
    setSeeding(true);
    setSeedProgress('');
    try {
      const result = await seedAllCourses(allCourses, (current, total, title) => {
        setSeedProgress(`Inicializando curso ${current} de ${total}: ${title}`);
      });
      if (result.success) {
        setToast({ type: 'success', message: `${allCourses.length} cursos inicializados correctamente` });
      } else {
        setToast({ type: 'error', message: result.error || 'Error al inicializar cursos' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Error al inicializar cursos' });
    } finally {
      setSeeding(false);
      setSeedProgress('');
    }
  };

  const handleReseedCourse = async (course) => {
    const seedData = allCourses.find(c => c.data.title === course.title);
    if (!seedData) {
      setToast({ type: 'error', message: `No se encontraron datos de seed para "${course.title}"` });
      return;
    }
    setSeedingCourseId(course.id);
    try {
      const result = await seedCourse(seedData.data, seedData.lessons);
      if (result.success) {
        setToast({ type: 'success', message: `"${course.title}" re-inicializado correctamente` });
      } else {
        setToast({ type: 'error', message: result.error || 'Error al re-inicializar curso' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Error al re-inicializar curso' });
    } finally {
      setSeedingCourseId(null);
    }
  };

  const getProgressForCourse = (courseId) => {
    return progress[courseId] || null;
  };

  const getCompletionPercent = (courseProgress, totalLessons) => {
    if (!courseProgress || !totalLessons) return 0;
    return Math.round((courseProgress.completedLessons || 0) / totalLessons * 100);
  };

  if (loading) {
    return (
      <div className="p-lg">
        <div className="flex items-center justify-between mb-base">
          <h1 className="heading-1">Cursos</h1>
        </div>
        <div className="empty-state">
          <div className="spinner"></div>
          <p className="text-base text-secondary">Cargando cursos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-lg">
      <div className="flex items-center justify-between mb-base">
        <h1 className="heading-1">Cursos</h1>
        {isAdmin && (
          <button
            className="btn btn-primary"
            onClick={handleSeedCourses}
            disabled={seeding}
          >
            <Icon name="plus" size={16} />
            {seeding ? 'Inicializando...' : 'Inicializar Cursos SyncFreight'}
          </button>
        )}
      </div>

      {seeding && seedProgress && (
        <div className="card mb-base p-base">
          <div className="flex items-center gap-sm">
            <div className="spinner"></div>
            <span className="text-sm text-secondary">{seedProgress}</span>
          </div>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="empty-state">
          <Icon name="book-open" size={48} />
          <p className="text-base text-secondary mt-base">No hay cursos disponibles</p>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => {
            const courseProgress = getProgressForCourse(course.id);
            const totalLessons = course.totalLessons || 0;
            const completedLessons = courseProgress?.completedLessons || 0;
            const percent = getCompletionPercent(courseProgress, totalLessons);
            const isCompleted = courseProgress?.courseCompleted === true;
            const dashOffset = PROGRESS_RING_CIRCUMFERENCE - (percent / 100) * PROGRESS_RING_CIRCUMFERENCE;

            return (
              <div
                key={course.id}
                className="course-card"
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <div className="course-card-banner" />
                <div className="course-card-body">
                  <div className="flex items-center justify-between mb-sm">
                    <h3 className="heading-3">{course.title}</h3>
                    <div className="flex items-center gap-sm">
                      {isCompleted && (
                        <span className="badge badge-success">Completado</span>
                      )}
                      {isAdmin && (
                        <button
                          className="btn btn-icon btn-sm"
                          title="Re-inicializar curso"
                          disabled={seedingCourseId === course.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmReseed(course);
                          }}
                        >
                          {seedingCourseId === course.id ? (
                            <div className="spinner" style={{ width: 16, height: 16 }} />
                          ) : (
                            <Icon name="refresh-cw" size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-secondary mb-base">{course.description}</p>
                  <div className="course-card-meta">
                    <div className="course-progress-ring">
                      <svg width="40" height="40" viewBox="0 0 40 40">
                        <circle
                          className="ring-bg"
                          cx="20"
                          cy="20"
                          r={PROGRESS_RING_RADIUS}
                          fill="none"
                          strokeWidth="3"
                        />
                        <circle
                          className="ring-fill"
                          cx="20"
                          cy="20"
                          r={PROGRESS_RING_RADIUS}
                          fill="none"
                          strokeWidth="3"
                          strokeDasharray={PROGRESS_RING_CIRCUMFERENCE}
                          strokeDashoffset={dashOffset}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="course-progress-text">{percent}%</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">
                        {completedLessons} de {totalLessons} lecciones
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirmReseed && (
        <ConfirmDialog
          isOpen={true}
          title="Re-inicializar curso"
          message={`Se actualizara el contenido y lecciones de "${confirmReseed.title}". El progreso de los usuarios se mantendra.`}
          confirmText="Re-inicializar"
          onConfirm={() => {
            handleReseedCourse(confirmReseed);
            setConfirmReseed(null);
          }}
          onCancel={() => setConfirmReseed(null)}
        />
      )}

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Courses;
