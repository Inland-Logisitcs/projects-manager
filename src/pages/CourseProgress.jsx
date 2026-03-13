import { useState, useEffect, useMemo, Fragment } from 'react';
import { subscribeToCourses, subscribeToAllCourseProgress, subscribeToLessons } from '../services/courseService';
import { subscribeToUsers } from '../services/userService';
import Icon from '../components/common/Icon';
import '../styles/CourseProgress.css';

const CourseProgress = () => {
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [allProgress, setAllProgress] = useState([]);
  const [lessonsMap, setLessonsMap] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs = [];
    unsubs.push(subscribeToCourses(setCourses));
    unsubs.push(subscribeToUsers(setUsers));
    unsubs.push(subscribeToAllCourseProgress((progress) => {
      setAllProgress(progress);
      setLoading(false);
    }));
    return () => unsubs.forEach(u => u());
  }, []);

  // Subscribe to lessons for selected course
  useEffect(() => {
    if (!selectedCourse) return;
    const unsub = subscribeToLessons(selectedCourse, (lessons) => {
      setLessonsMap(prev => ({ ...prev, [selectedCourse]: lessons }));
    });
    return () => unsub();
  }, [selectedCourse]);

  // Auto-select first course
  useEffect(() => {
    if (courses.length > 0 && !selectedCourse) {
      setSelectedCourse(courses[0].id);
    }
  }, [courses, selectedCourse]);

  const currentCourse = courses.find(c => c.id === selectedCourse);
  const currentLessons = lessonsMap[selectedCourse] || [];

  const usersProgress = useMemo(() => {
    if (!selectedCourse) return [];

    return users
      .map(user => {
        const progress = allProgress.find(p => p.userId === user.id && p.courseId === selectedCourse);
        const lessonDetails = currentLessons.map(lesson => {
          const lp = progress?.lessonProgress?.[lesson.id];
          return {
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            lessonOrder: lesson.order,
            passed: lp?.testPassed || false,
            attempts: lp?.attempts || 0,
            bestScore: lp?.bestScore || 0,
            totalQuestions: lp?.totalQuestions || 0,
            firstAttemptAt: lp?.firstAttemptAt ? toDate(lp.firstAttemptAt) : null,
            passedAt: lp?.passedAt ? toDate(lp.passedAt) : null,
            lastAttemptAt: lp?.lastAttemptAt ? toDate(lp.lastAttemptAt) : null,
            timeSpentSeconds: lp?.timeSpentSeconds || null,
          };
        });

        const completedLessons = lessonDetails.filter(l => l.passed).length;
        const totalLessons = currentLessons.length;
        const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        return {
          user,
          progress,
          lessonDetails,
          completedLessons,
          totalLessons,
          percent,
          courseCompleted: progress?.courseCompleted || false,
          startedAt: progress?.createdAt ? toDate(progress.createdAt) : null,
          completedAt: progress?.completedAt ? toDate(progress.completedAt) : null,
        };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [selectedCourse, users, allProgress, currentLessons]);

  if (loading) {
    return (
      <div className="p-lg">
        <h1 className="heading-1 mb-base">Progreso de Cursos</h1>
        <div className="empty-state">
          <div className="spinner"></div>
          <p className="text-base text-secondary">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-lg">
      <h1 className="heading-1 mb-base">Progreso de Cursos</h1>

      {/* Course selector */}
      <div className="mb-lg" style={{ maxWidth: 400 }}>
        <select
          className="select"
          value={selectedCourse || ''}
          onChange={(e) => { setSelectedCourse(e.target.value); setExpandedUser(null); }}
        >
          {courses.map(course => (
            <option key={course.id} value={course.id}>{course.title}</option>
          ))}
        </select>
      </div>

      {currentCourse && (
        <>
          {/* Summary stats */}
          <div className="cp-stats mb-lg">
            <div className="cp-stat-card">
              <span className="cp-stat-value">{usersProgress.length}</span>
              <span className="cp-stat-label">Usuarios</span>
            </div>
            <div className="cp-stat-card">
              <span className="cp-stat-value">
                {usersProgress.filter(u => u.courseCompleted).length}
              </span>
              <span className="cp-stat-label">Completaron</span>
            </div>
            <div className="cp-stat-card">
              <span className="cp-stat-value">
                {usersProgress.filter(u => u.percent > 0 && !u.courseCompleted).length}
              </span>
              <span className="cp-stat-label">En progreso</span>
            </div>
            <div className="cp-stat-card">
              <span className="cp-stat-value">
                {usersProgress.filter(u => u.percent === 0).length}
              </span>
              <span className="cp-stat-label">Sin iniciar</span>
            </div>
          </div>

          {/* Users table */}
          <div className="card">
            <table className="cp-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Progreso</th>
                  <th>Lecciones</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {usersProgress.map(({ user, lessonDetails, completedLessons, totalLessons, percent, courseCompleted, startedAt, completedAt }) => (
                  <Fragment key={user.id}>
                    <tr
                      className="cp-user-row"
                      onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                    >
                      <td>
                        <div className="flex items-center gap-sm">
                          <div className="cp-avatar">
                            {(user.displayName || user.email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{user.displayName || user.email}</div>
                            {user.displayName && (
                              <div className="text-xs text-tertiary">{user.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="cp-progress-bar-container">
                          <div className="cp-progress-bar" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="text-xs text-secondary">{percent}%</span>
                      </td>
                      <td>
                        <span className="text-sm">{completedLessons} / {totalLessons}</span>
                      </td>
                      <td>
                        {courseCompleted ? (
                          <span className="badge badge-success">Completado</span>
                        ) : percent > 0 ? (
                          <span className="badge badge-warning">En progreso</span>
                        ) : (
                          <span className="badge">Sin iniciar</span>
                        )}
                      </td>
                      <td>
                        <Icon name={expandedUser === user.id ? 'chevron-up' : 'chevron-down'} size={16} />
                      </td>
                    </tr>

                    {expandedUser === user.id && (
                      <tr className="cp-detail-row">
                        <td colSpan={5}>
                          <div className="cp-lessons-detail">
                            {startedAt && (
                              <p className="text-xs text-tertiary mb-sm">
                                Inicio: {formatDate(startedAt)}
                                {completedAt && <> | Finalizo: {formatDate(completedAt)} | Duracion total: {formatDuration(startedAt, completedAt)}</>}
                              </p>
                            )}
                            <table className="cp-lessons-table">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Leccion</th>
                                  <th>Estado</th>
                                  <th>Intentos</th>
                                  <th>Mejor nota</th>
                                  <th>Tiempo</th>
                                </tr>
                              </thead>
                              <tbody>
                                {lessonDetails.map(ld => (
                                  <tr key={ld.lessonId}>
                                    <td className="text-xs text-tertiary">{ld.lessonOrder}</td>
                                    <td className="text-sm">{ld.lessonTitle}</td>
                                    <td>
                                      {ld.passed ? (
                                        <Icon name="check-circle" size={16} className="cp-icon-success" />
                                      ) : ld.attempts > 0 ? (
                                        <Icon name="clock" size={16} className="cp-icon-warning" />
                                      ) : (
                                        <Icon name="minus" size={16} className="cp-icon-muted" />
                                      )}
                                    </td>
                                    <td>
                                      {ld.attempts > 0 ? (
                                        <span className={`text-sm ${ld.attempts > 2 ? 'cp-text-warning' : ''}`}>
                                          {ld.attempts}
                                        </span>
                                      ) : (
                                        <span className="text-xs text-tertiary">-</span>
                                      )}
                                    </td>
                                    <td>
                                      {ld.attempts > 0 ? (
                                        <span className="text-sm">{ld.bestScore}/{ld.totalQuestions}</span>
                                      ) : (
                                        <span className="text-xs text-tertiary">-</span>
                                      )}
                                    </td>
                                    <td>
                                      {ld.timeSpentSeconds ? (
                                        <span className="text-xs text-secondary">
                                          {formatSeconds(ld.timeSpentSeconds)}
                                        </span>
                                      ) : ld.attempts > 0 && !ld.passed ? (
                                        <span className="text-xs text-tertiary">En curso</span>
                                      ) : (
                                        <span className="text-xs text-tertiary">-</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// Helpers

const toDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (val.toDate) return val.toDate(); // Firestore Timestamp
  if (typeof val === 'string' || typeof val === 'number') return new Date(val);
  return null;
};

const formatDate = (date) => {
  if (!date) return '-';
  return date.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatSeconds = (totalSeconds) => {
  if (!totalSeconds || totalSeconds < 60) return 'Menos de 1 min';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hours}h ${remainMins}m`;
};

const formatDuration = (start, end) => {
  if (!start || !end) return '-';
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Menos de 1 min';
  if (diffMins < 60) return `${diffMins} min`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (hours < 24) return `${hours}h ${mins}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
};

export default CourseProgress;
