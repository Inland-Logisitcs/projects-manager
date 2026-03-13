import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getCourse,
  subscribeToLessons,
  getCourseProgress,
  saveTestResult,
  markCourseCompleted,
  seedCourse
} from '../services/courseService';
import { allCourses } from '../data/courses';
import { useAuth } from '../contexts/AuthContext';
import TestRunner from '../components/courses/TestRunner';
import LessonContent from '../components/courses/LessonContent';
import Icon from '../components/common/Icon';
import Toast from '../components/common/Toast';
import ConfirmDialog from '../components/common/ConfirmDialog';
import '../styles/Courses.css';

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [view, setView] = useState('content');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [reseedLoading, setReseedLoading] = useState(false);
  const [confirmReseed, setConfirmReseed] = useState(false);
  const lessonStartTimeRef = useRef(null);

  const loadProgress = useCallback(async () => {
    if (!user || !courseId) return;
    const result = await getCourseProgress(user.uid, courseId);
    if (result.success) {
      setProgress(result.progress);
    }
  }, [user, courseId]);

  useEffect(() => {
    const fetchCourse = async () => {
      const result = await getCourse(courseId);
      if (result.success) {
        setCourse(result.course);
      } else {
        setToast({ type: 'error', message: 'No se pudo cargar el curso' });
      }
    };

    fetchCourse();
    loadProgress();

    const unsubscribeLessons = subscribeToLessons(courseId, (fetchedLessons) => {
      setLessons(fetchedLessons);
      setLoading(false);
    });

    return () => {
      unsubscribeLessons();
    };
  }, [courseId, loadProgress]);

  // Redirect to first unlocked lesson if current is locked
  useEffect(() => {
    if (lessons.length === 0 || !progress) return;

    const isUnlocked = (index) => {
      if (index === 0) return true;
      const prevLesson = lessons[index - 1];
      const prevProgress = progress?.lessonProgress?.[prevLesson.id];
      return prevProgress?.testPassed === true;
    };

    if (!isUnlocked(currentLessonIndex)) {
      const firstUnlocked = lessons.findIndex((_, i) => isUnlocked(i) && !isLessonPassed(i));
      setCurrentLessonIndex(firstUnlocked >= 0 ? firstUnlocked : 0);
    }
  }, [lessons, progress, currentLessonIndex]);

  const isLessonPassed = (index) => {
    const lesson = lessons[index];
    if (!lesson || !progress?.lessonProgress) return false;
    return progress.lessonProgress[lesson.id]?.testPassed === true;
  };

  const isLessonUnlocked = (index) => {
    if (index === 0) return true;
    const prevLesson = lessons[index - 1];
    if (!prevLesson) return false;
    const prevProgress = progress?.lessonProgress?.[prevLesson.id];
    return prevProgress?.testPassed === true;
  };

  const getLessonStatus = (index) => {
    if (isLessonPassed(index)) return 'completed';
    if (isLessonUnlocked(index)) return 'current';
    return 'locked';
  };

  const handleReseedCourse = async () => {
    if (!course) return;
    const seedData = allCourses.find(c => c.data.title === course.title);
    if (!seedData) {
      setToast({ type: 'error', message: `No se encontraron datos de seed para "${course.title}"` });
      return;
    }
    setReseedLoading(true);
    try {
      const result = await seedCourse(seedData.data, seedData.lessons);
      if (result.success) {
        setToast({ type: 'success', message: 'Curso re-inicializado correctamente' });
      } else {
        setToast({ type: 'error', message: result.error || 'Error al re-inicializar curso' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Error al re-inicializar curso' });
    } finally {
      setReseedLoading(false);
    }
  };

  const currentLesson = lessons[currentLessonIndex] || null;
  const isLastLesson = currentLessonIndex === lessons.length - 1;
  const isCourseCompleted = progress?.courseCompleted === true;
  const currentLessonHasTest = currentLesson?.test?.questions?.length > 0;

  // Reset timer when lesson changes
  useEffect(() => {
    lessonStartTimeRef.current = Date.now();
  }, [currentLessonIndex]);

  const getTimeSpentSeconds = () => {
    if (!lessonStartTimeRef.current) return null;
    return Math.round((Date.now() - lessonStartTimeRef.current) / 1000);
  };

  const handleLessonClick = (index) => {
    if (!isLessonUnlocked(index)) return;
    setCurrentLessonIndex(index);
    setView('content');
  };

  const handleStartTest = () => {
    setView('test');
  };

  // Called on every test submit (pass or fail) to save the attempt
  const handleSaveAttempt = async (score, totalQuestions) => {
    if (!user || !currentLesson) return;

    const timeSpent = getTimeSpentSeconds();
    const result = await saveTestResult(user.uid, courseId, currentLesson.id, score, totalQuestions, timeSpent);
    if (!result.success) {
      setToast({ type: 'error', message: 'Error al guardar el resultado del test' });
      return;
    }

    await loadProgress();

    const passed = score === totalQuestions;
    if (!passed) {
      setToast({ type: 'error', message: 'No aprobaste el test. Puedes intentarlo de nuevo.' });
    }
  };

  // Called only when the user clicks "Continuar" after passing - handles navigation
  const handleTestComplete = async (score, totalQuestions) => {
    if (!user || !currentLesson) return;

    if (isLastLesson) {
      await markCourseCompleted(user.uid, courseId);
      await loadProgress();
      setView('complete');
      setToast({ type: 'success', message: 'Has completado el curso' });
    } else {
      setToast({ type: 'success', message: 'Test aprobado. Avanzando a la siguiente leccion...' });
      setTimeout(() => {
        setCurrentLessonIndex(prev => prev + 1);
        setView('content');
      }, 1500);
    }
  };

  const handleContinueWithoutTest = async () => {
    if (!user || !currentLesson) return;

    // Mark as passed with perfect score (no test = auto-pass)
    const timeSpent = getTimeSpentSeconds();
    const result = await saveTestResult(user.uid, courseId, currentLesson.id, 1, 1, timeSpent);
    if (!result.success) {
      setToast({ type: 'error', message: 'Error al guardar el progreso' });
      return;
    }

    await loadProgress();

    if (isLastLesson) {
      await markCourseCompleted(user.uid, courseId);
      await loadProgress();
      setView('complete');
      setToast({ type: 'success', message: 'Has completado el curso' });
    } else {
      setCurrentLessonIndex(prev => prev + 1);
      setView('content');
    }
  };

  if (loading) {
    return (
      <div className="p-lg">
        <div className="empty-state">
          <div className="spinner"></div>
          <p className="text-base text-secondary">Cargando curso...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-lg">
        <div className="empty-state">
          <Icon name="alert-circle" size={48} />
          <p className="text-base text-secondary mt-base">Curso no encontrado</p>
          <button className="btn btn-primary mt-base" onClick={() => navigate('/courses')}>
            Volver a cursos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-lg">
      <div className="flex items-center justify-between mb-base">
        <div className="flex items-center gap-sm">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/courses')}>
            <Icon name="arrow-left" size={16} />
            Volver
          </button>
          <h1 className="heading-2">{course.title}</h1>
        </div>
        {isAdmin && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setConfirmReseed(true)}
            disabled={reseedLoading}
          >
            {reseedLoading ? (
              <div className="spinner" style={{ width: 16, height: 16 }} />
            ) : (
              <Icon name="refresh-cw" size={16} />
            )}
            {reseedLoading ? 'Re-inicializando...' : 'Re-inicializar'}
          </button>
        )}
      </div>

      {isCourseCompleted && view !== 'complete' && (
        <div className="course-complete-banner mb-base">
          <Icon name="award" size={32} />
          <h2 className="heading-3 mt-sm">Curso completado</h2>
          <p className="text-sm mt-sm">Has finalizado todas las lecciones de este curso.</p>
        </div>
      )}

      {view === 'complete' && (
        <div className="course-complete-banner mb-base">
          <Icon name="award" size={48} />
          <h2 className="heading-2 mt-sm">Felicitaciones</h2>
          <p className="text-base mt-sm">Has completado exitosamente todas las lecciones del curso.</p>
          <button className="btn btn-secondary mt-base" onClick={() => navigate('/courses')}>
            Volver a cursos
          </button>
        </div>
      )}

      <div className="course-detail">
        {/* Sidebar */}
        <div className="course-sidebar">
          <div className="course-sidebar-header">
            <h3 className="heading-3">Lecciones</h3>
            <p className="text-sm text-secondary mt-sm">
              {progress?.completedLessons || 0} de {lessons.length} completadas
            </p>
          </div>
          <ul className="course-lesson-list">
            {lessons.map((lesson, index) => {
              const status = getLessonStatus(index);
              const isActive = index === currentLessonIndex && view !== 'complete';

              return (
                <li
                  key={lesson.id}
                  className={`course-lesson-item ${isActive ? 'active' : ''} ${status === 'locked' ? 'locked' : ''}`}
                  onClick={() => handleLessonClick(index)}
                >
                  <span className={`lesson-status-icon ${status}`}>
                    {status === 'completed' && <Icon name="check-circle" size={18} />}
                    {status === 'current' && <Icon name="circle" size={18} />}
                    {status === 'locked' && <Icon name="lock" size={18} />}
                  </span>
                  <span className="lesson-number">{index + 1}</span>
                  <span className="text-sm">{lesson.title}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Main Content */}
        <div className="course-content">
          {view === 'complete' ? (
            <div className="course-welcome">
              <div className="course-welcome-icon">
                <Icon name="check-circle" size={64} />
              </div>
              <h2 className="heading-2">Curso finalizado</h2>
              <p className="text-base text-secondary mt-sm">
                Has completado todas las lecciones y tests de este curso.
              </p>
            </div>
          ) : currentLesson ? (
            <>
              <div className="lesson-content-header">
                <div>
                  <h2 className="heading-3">{currentLesson.title}</h2>
                  <p className="text-sm text-secondary">
                    Leccion {currentLessonIndex + 1} de {lessons.length}
                  </p>
                </div>
                {isLessonPassed(currentLessonIndex) && (
                  <span className="badge badge-success">Aprobada</span>
                )}
              </div>

              {view === 'content' && (
                <>
                  <LessonContent html={currentLesson.content} />
                  <div className="lesson-nav">
                    <div>
                      {currentLessonIndex > 0 && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setCurrentLessonIndex(prev => prev - 1);
                            setView('content');
                          }}
                        >
                          <Icon name="arrow-left" size={16} />
                          Anterior
                        </button>
                      )}
                    </div>
                    <div>
                      {isLessonPassed(currentLessonIndex) ? (
                        !isLastLesson && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setCurrentLessonIndex(prev => prev + 1);
                              setView('content');
                            }}
                          >
                            Siguiente
                            <Icon name="arrow-right" size={16} />
                          </button>
                        )
                      ) : currentLessonHasTest ? (
                        <button className="btn btn-primary" onClick={handleStartTest}>
                          <Icon name="file-text" size={16} />
                          Tomar Test
                        </button>
                      ) : (
                        <button className="btn btn-primary" onClick={handleContinueWithoutTest}>
                          Continuar
                          <Icon name="arrow-right" size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {view === 'test' && currentLesson.test && (
                <TestRunner
                  test={currentLesson.test}
                  onComplete={handleTestComplete}
                  onSaveAttempt={handleSaveAttempt}
                  previousScore={
                    progress?.lessonProgress?.[currentLesson.id] || null
                  }
                />
              )}
            </>
          ) : (
            <div className="course-welcome">
              <div className="course-welcome-icon">
                <Icon name="book-open" size={64} />
              </div>
              <h2 className="heading-2">Selecciona una leccion</h2>
              <p className="text-base text-secondary mt-sm">
                Elige una leccion del menu lateral para comenzar.
              </p>
            </div>
          )}
        </div>
      </div>

      {confirmReseed && (
        <ConfirmDialog
          isOpen={true}
          title="Re-inicializar curso"
          message={`Se actualizara el contenido y lecciones de "${course.title}". El progreso de los usuarios se mantendra.`}
          confirmText="Re-inicializar"
          onConfirm={() => {
            handleReseedCourse();
            setConfirmReseed(false);
          }}
          onCancel={() => setConfirmReseed(false)}
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

export default CourseDetail;
