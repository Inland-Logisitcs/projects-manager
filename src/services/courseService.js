import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDocs,
  getDoc,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COURSES_COLLECTION = 'courses';
const LESSONS_COLLECTION = 'lessons';
const COURSE_PROGRESS_COLLECTION = 'courseProgress';

// ============ COURSES ============

export const subscribeToCourses = (callback) => {
  try {
    const q = query(
      collection(db, COURSES_COLLECTION),
      orderBy('order', 'asc')
    );
    return onSnapshot(q,
      (snapshot) => {
        const courses = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(c => c.published !== false);
        callback(courses);
      },
      (error) => {
        console.error('Error subscribing to courses:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up courses subscription:', error);
    return () => {};
  }
};

export const subscribeToAllCourses = (callback) => {
  try {
    const q = query(
      collection(db, COURSES_COLLECTION),
      orderBy('order', 'asc')
    );
    return onSnapshot(q,
      (snapshot) => {
        const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(courses);
      },
      (error) => {
        console.error('Error subscribing to all courses:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up courses subscription:', error);
    return () => {};
  }
};

export const getCourse = async (courseId) => {
  try {
    const docRef = doc(db, COURSES_COLLECTION, courseId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, course: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Course not found' };
  } catch (error) {
    console.error('Error getting course:', error);
    return { success: false, error: error.message };
  }
};

export const createCourse = async (courseData) => {
  try {
    const docRef = await addDoc(collection(db, COURSES_COLLECTION), {
      ...courseData,
      published: courseData.published ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating course:', error);
    return { success: false, error: error.message };
  }
};

export const updateCourse = async (courseId, updates) => {
  try {
    await updateDoc(doc(db, COURSES_COLLECTION, courseId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating course:', error);
    return { success: false, error: error.message };
  }
};

export const deleteCourse = async (courseId) => {
  try {
    // Delete all lessons first
    const lessonsQuery = query(
      collection(db, LESSONS_COLLECTION),
      where('courseId', '==', courseId)
    );
    const lessonsSnap = await getDocs(lessonsQuery);
    const batch = writeBatch(db);
    lessonsSnap.docs.forEach(lessonDoc => {
      batch.delete(lessonDoc.ref);
    });
    batch.delete(doc(db, COURSES_COLLECTION, courseId));
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error deleting course:', error);
    return { success: false, error: error.message };
  }
};

// ============ LESSONS ============

export const subscribeToLessons = (courseId, callback) => {
  try {
    const q = query(
      collection(db, LESSONS_COLLECTION),
      where('courseId', '==', courseId)
    );
    return onSnapshot(q,
      (snapshot) => {
        const lessons = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(lessons);
      },
      (error) => {
        console.error('Error subscribing to lessons:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up lessons subscription:', error);
    return () => {};
  }
};

export const getLesson = async (lessonId) => {
  try {
    const docRef = doc(db, LESSONS_COLLECTION, lessonId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, lesson: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Lesson not found' };
  } catch (error) {
    console.error('Error getting lesson:', error);
    return { success: false, error: error.message };
  }
};

export const createLesson = async (lessonData) => {
  try {
    const docRef = await addDoc(collection(db, LESSONS_COLLECTION), {
      ...lessonData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating lesson:', error);
    return { success: false, error: error.message };
  }
};

// ============ PROGRESS ============

const getProgressDocId = (userId, courseId) => `${userId}_${courseId}`;

export const subscribeToCourseProgress = (userId, callback) => {
  try {
    const q = query(
      collection(db, COURSE_PROGRESS_COLLECTION),
      where('userId', '==', userId)
    );
    return onSnapshot(q,
      (snapshot) => {
        const progressMap = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          progressMap[data.courseId] = { id: doc.id, ...data };
        });
        callback(progressMap);
      },
      (error) => {
        console.error('Error subscribing to course progress:', error);
        callback({});
      }
    );
  } catch (error) {
    console.error('Error setting up progress subscription:', error);
    return () => {};
  }
};

export const getCourseProgress = async (userId, courseId) => {
  try {
    const docId = getProgressDocId(userId, courseId);
    const docRef = doc(db, COURSE_PROGRESS_COLLECTION, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, progress: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: true, progress: null };
  } catch (error) {
    console.error('Error getting course progress:', error);
    return { success: false, error: error.message };
  }
};

export const saveTestResult = async (userId, courseId, lessonId, score, totalQuestions, timeSpentSeconds = null) => {
  try {
    const docId = getProgressDocId(userId, courseId);
    const docRef = doc(db, COURSE_PROGRESS_COLLECTION, docId);
    const docSnap = await getDoc(docRef);

    const passed = score === totalQuestions;
    const now = new Date();

    if (docSnap.exists()) {
      const existing = docSnap.data();
      const lessonProgress = existing.lessonProgress || {};
      const currentLesson = lessonProgress[lessonId] || { bestScore: 0, attempts: 0 };

      lessonProgress[lessonId] = {
        testPassed: passed || currentLesson.testPassed || false,
        bestScore: Math.max(currentLesson.bestScore || 0, score),
        totalQuestions,
        attempts: (currentLesson.attempts || 0) + 1,
        firstAttemptAt: currentLesson.firstAttemptAt || now,
        lastAttemptAt: now,
        passedAt: (passed && !currentLesson.testPassed) ? now : (currentLesson.passedAt || null),
        timeSpentSeconds: passed && !currentLesson.testPassed ? timeSpentSeconds : (currentLesson.timeSpentSeconds || null)
      };

      const completedCount = Object.values(lessonProgress).filter(lp => lp.testPassed).length;

      await updateDoc(docRef, {
        lessonProgress,
        completedLessons: completedCount,
        updatedAt: serverTimestamp()
      });
    } else {
      const lessonProgress = {
        [lessonId]: {
          testPassed: passed,
          bestScore: score,
          totalQuestions,
          attempts: 1,
          firstAttemptAt: now,
          lastAttemptAt: now,
          passedAt: passed ? now : null,
          timeSpentSeconds: passed ? timeSpentSeconds : null
        }
      };

      await setDoc(docRef, {
        userId,
        courseId,
        lessonProgress,
        completedLessons: passed ? 1 : 0,
        courseCompleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    return { success: true, passed };
  } catch (error) {
    console.error('Error saving test result:', error);
    return { success: false, error: error.message };
  }
};

export const markCourseCompleted = async (userId, courseId) => {
  try {
    const docId = getProgressDocId(userId, courseId);
    await updateDoc(doc(db, COURSE_PROGRESS_COLLECTION, docId), {
      courseCompleted: true,
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error marking course completed:', error);
    return { success: false, error: error.message };
  }
};

// ============ ADMIN: ALL PROGRESS ============

export const subscribeToAllCourseProgress = (callback) => {
  try {
    const q = query(collection(db, COURSE_PROGRESS_COLLECTION));
    return onSnapshot(q,
      (snapshot) => {
        const progress = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(progress);
      },
      (error) => {
        console.error('Error subscribing to all course progress:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up all progress subscription:', error);
    return () => {};
  }
};

// ============ SEED ============

export const seedCourse = async (courseData, lessonsData) => {
  try {
    const q = query(
      collection(db, COURSES_COLLECTION),
      where('title', '==', courseData.title)
    );
    const existing = await getDocs(q);

    let courseId;

    if (!existing.empty) {
      // Update existing course to preserve ID and user progress
      courseId = existing.docs[0].id;
      await updateCourse(courseId, {
        ...courseData,
        published: courseData.published ?? true
      });

      // Get existing lessons for this course
      const existingLessonsQuery = query(
        collection(db, LESSONS_COLLECTION),
        where('courseId', '==', courseId)
      );
      const existingLessonsSnap = await getDocs(existingLessonsQuery);
      const existingLessonsByOrder = {};
      existingLessonsSnap.docs.forEach(d => {
        const data = d.data();
        existingLessonsByOrder[data.order] = d.id;
      });

      // Update or create lessons
      for (const lesson of lessonsData) {
        const existingLessonId = existingLessonsByOrder[lesson.order];
        if (existingLessonId) {
          await updateDoc(doc(db, LESSONS_COLLECTION, existingLessonId), {
            ...lesson,
            courseId,
            updatedAt: serverTimestamp()
          });
          delete existingLessonsByOrder[lesson.order];
        } else {
          await createLesson({ ...lesson, courseId });
        }
      }

      // Delete lessons that no longer exist in seed data
      for (const orphanId of Object.values(existingLessonsByOrder)) {
        await deleteDoc(doc(db, LESSONS_COLLECTION, orphanId));
      }
    } else {
      const courseResult = await createCourse(courseData);
      if (!courseResult.success) return courseResult;
      courseId = courseResult.id;

      for (const lesson of lessonsData) {
        await createLesson({ ...lesson, courseId });
      }
    }

    return { success: true, courseId };
  } catch (error) {
    console.error('Error seeding course:', error);
    return { success: false, error: error.message };
  }
};

export const seedAllCourses = async (coursesArray, onProgress) => {
  const results = [];
  for (let i = 0; i < coursesArray.length; i++) {
    const { data, lessons } = coursesArray[i];
    if (onProgress) onProgress(i + 1, coursesArray.length, data.title);
    const result = await seedCourse(data, lessons);
    results.push({ title: data.title, ...result });
    if (!result.success) {
      return { success: false, error: `Error en curso "${data.title}": ${result.error}`, results };
    }
  }
  return { success: true, results };
};
