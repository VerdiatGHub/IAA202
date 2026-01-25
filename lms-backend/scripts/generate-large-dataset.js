/**
 * Large Dataset Generation Script
 * 
 * This script generates test data for performance and stress testing:
 * - 100+ modules
 * - 5-10 lessons per module
 * - 3-5 content items per lesson
 * - Mix of content types (video, text, quiz, assignment, resource)
 * - Mix of required and optional content
 * 
 * Usage:
 *   node scripts/generate-large-dataset.js <courseId> [moduleCount]
 * 
 * Example:
 *   node scripts/generate-large-dataset.js 550e8400-e29b-41d4-a716-446655440000 150
 */

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'lms_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// Configuration
const CONTENT_TYPES = ['video', 'text', 'quiz', 'assignment', 'resource'];
const VIDEO_URLS = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://vimeo.com/123456789',
  'https://www.youtube.com/watch?v=jNQXAC9IVRw',
];
const RESOURCE_URLS = [
  'https://example.com/resource1.pdf',
  'https://example.com/resource2.docx',
  'https://example.com/resource3.pptx',
];

// Helper functions
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomBoolean() {
  return Math.random() > 0.5;
}

// Generate module data
function generateModule(courseId, orderIndex) {
  return {
    id: uuidv4(),
    courseId,
    title: `Module ${orderIndex + 1}: ${generateModuleTitle()}`,
    description: generateDescription(),
    orderIndex,
  };
}

function generateModuleTitle() {
  const topics = [
    'Introduction to Programming',
    'Data Structures and Algorithms',
    'Web Development Fundamentals',
    'Database Design',
    'Software Engineering Principles',
    'Advanced JavaScript',
    'React and Modern Frameworks',
    'Backend Development',
    'API Design and Development',
    'Testing and Quality Assurance',
    'DevOps and Deployment',
    'Security Best Practices',
    'Performance Optimization',
    'Mobile Development',
    'Cloud Computing',
  ];
  return randomChoice(topics);
}

function generateDescription() {
  const descriptions = [
    'This module covers fundamental concepts and practical applications.',
    'Learn essential skills and techniques through hands-on exercises.',
    'Explore advanced topics and real-world scenarios.',
    'Master the core principles and best practices.',
    'Dive deep into practical implementations and case studies.',
  ];
  return randomChoice(descriptions);
}

// Generate lesson data
function generateLesson(moduleId, orderIndex) {
  return {
    id: uuidv4(),
    moduleId,
    title: `Lesson ${orderIndex + 1}: ${generateLessonTitle()}`,
    content: generateDescription(),
    videoUrl: randomBoolean() ? randomChoice(VIDEO_URLS) : null,
    orderIndex,
    duration: randomInt(10, 60),
    isRequired: randomBoolean(),
  };
}

function generateLessonTitle() {
  const topics = [
    'Getting Started',
    'Core Concepts',
    'Practical Examples',
    'Advanced Techniques',
    'Best Practices',
    'Common Pitfalls',
    'Real-world Applications',
    'Hands-on Exercise',
    'Review and Summary',
    'Quiz and Assessment',
  ];
  return randomChoice(topics);
}

// Generate content item data
function generateContentItem(lessonId, orderIndex) {
  const contentType = randomChoice(CONTENT_TYPES);
  const baseItem = {
    id: uuidv4(),
    lessonId,
    contentType,
    title: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)}: ${generateContentTitle()}`,
    description: generateDescription(),
    orderIndex,
    isRequired: randomBoolean(),
  };

  // Add type-specific fields
  switch (contentType) {
    case 'video':
      return {
        ...baseItem,
        videoUrl: randomChoice(VIDEO_URLS),
        duration: randomInt(5, 30),
      };
    case 'text':
      return {
        ...baseItem,
        textContent: generateTextContent(),
      };
    case 'quiz':
      return {
        ...baseItem,
        quizId: null, // Would need to link to existing quiz
      };
    case 'assignment':
      return {
        ...baseItem,
        assignmentId: null, // Would need to link to existing assignment
      };
    case 'resource':
      return {
        ...baseItem,
        resourceType: randomBoolean() ? 'link' : 'file',
        resourceUrl: randomChoice(RESOURCE_URLS),
        filePath: null,
      };
    default:
      return baseItem;
  }
}

function generateContentTitle() {
  const titles = [
    'Introduction and Overview',
    'Key Concepts Explained',
    'Step-by-Step Tutorial',
    'Practice Exercise',
    'Additional Resources',
    'Deep Dive Analysis',
    'Quick Reference Guide',
    'Common Questions',
    'Summary and Review',
    'Next Steps',
  ];
  return randomChoice(titles);
}

function generateTextContent() {
  return `
    <h2>Introduction</h2>
    <p>This section covers important concepts and practical applications.</p>
    
    <h3>Key Points</h3>
    <ul>
      <li>Understanding the fundamentals</li>
      <li>Applying best practices</li>
      <li>Avoiding common mistakes</li>
    </ul>
    
    <h3>Examples</h3>
    <p>Here are some practical examples to help you understand the concepts better.</p>
    
    <h3>Summary</h3>
    <p>In this section, we covered the essential topics and their applications.</p>
  `;
}

// Database insertion functions
async function insertModule(client, module) {
  const query = `
    INSERT INTO modules (id, course_id, title, description, order_index, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
  `;
  await client.query(query, [
    module.id,
    module.courseId,
    module.title,
    module.description,
    module.orderIndex,
  ]);
}

async function insertLesson(client, lesson) {
  const query = `
    INSERT INTO lessons (id, course_id, module_id, title, content, video_url, order_index, duration, is_required, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
  `;
  await client.query(query, [
    lesson.id,
    lesson.courseId || null, // May be null if using module-only structure
    lesson.moduleId,
    lesson.title,
    lesson.content,
    lesson.videoUrl,
    lesson.orderIndex,
    lesson.duration,
    lesson.isRequired,
  ]);
}

async function insertContentItem(client, item) {
  const query = `
    INSERT INTO content_items (
      id, lesson_id, content_type, title, description, order_index, is_required,
      video_url, duration, text_content, quiz_id, assignment_id,
      resource_type, resource_url, file_path, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
  `;
  await client.query(query, [
    item.id,
    item.lessonId,
    item.contentType,
    item.title,
    item.description,
    item.orderIndex,
    item.isRequired,
    item.videoUrl || null,
    item.duration || null,
    item.textContent || null,
    item.quizId || null,
    item.assignmentId || null,
    item.resourceType || null,
    item.resourceUrl || null,
    item.filePath || null,
  ]);
}

// Main generation function
async function generateLargeDataset(courseId, moduleCount = 100) {
  const client = await pool.connect();
  
  try {
    console.log(`Starting large dataset generation for course ${courseId}`);
    console.log(`Target: ${moduleCount} modules`);
    
    // Verify course exists
    const courseCheck = await client.query('SELECT id FROM courses WHERE id = $1', [courseId]);
    if (courseCheck.rows.length === 0) {
      throw new Error(`Course with ID ${courseId} not found`);
    }
    
    await client.query('BEGIN');
    
    let totalLessons = 0;
    let totalContentItems = 0;
    
    // Generate modules
    for (let m = 0; m < moduleCount; m++) {
      const module = generateModule(courseId, m);
      await insertModule(client, module);
      
      // Generate lessons for this module
      const lessonCount = randomInt(5, 10);
      for (let l = 0; l < lessonCount; l++) {
        const lesson = generateLesson(module.id, l);
        lesson.courseId = courseId; // Add courseId for backward compatibility
        await insertLesson(client, lesson);
        totalLessons++;
        
        // Generate content items for this lesson
        const contentItemCount = randomInt(3, 5);
        for (let c = 0; c < contentItemCount; c++) {
          const contentItem = generateContentItem(lesson.id, c);
          await insertContentItem(client, contentItem);
          totalContentItems++;
        }
      }
      
      // Progress indicator
      if ((m + 1) % 10 === 0) {
        console.log(`Progress: ${m + 1}/${moduleCount} modules created`);
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n✅ Dataset generation complete!');
    console.log(`   Modules: ${moduleCount}`);
    console.log(`   Lessons: ${totalLessons}`);
    console.log(`   Content Items: ${totalContentItems}`);
    console.log(`   Total Records: ${moduleCount + totalLessons + totalContentItems}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error generating dataset:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Cleanup function
async function cleanupTestData(courseId) {
  const client = await pool.connect();
  
  try {
    console.log(`Cleaning up test data for course ${courseId}`);
    
    await client.query('BEGIN');
    
    // Delete in reverse order due to foreign key constraints
    const contentItemsResult = await client.query(
      'DELETE FROM content_items WHERE lesson_id IN (SELECT id FROM lessons WHERE course_id = $1)',
      [courseId]
    );
    console.log(`   Deleted ${contentItemsResult.rowCount} content items`);
    
    const lessonsResult = await client.query(
      'DELETE FROM lessons WHERE course_id = $1',
      [courseId]
    );
    console.log(`   Deleted ${lessonsResult.rowCount} lessons`);
    
    const modulesResult = await client.query(
      'DELETE FROM modules WHERE course_id = $1',
      [courseId]
    );
    console.log(`   Deleted ${modulesResult.rowCount} modules`);
    
    await client.query('COMMIT');
    
    console.log('✅ Cleanup complete!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error cleaning up data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node generate-large-dataset.js <courseId> [moduleCount]');
    console.log('       node generate-large-dataset.js <courseId> --cleanup');
    console.log('');
    console.log('Examples:');
    console.log('  Generate 100 modules: node generate-large-dataset.js 550e8400-e29b-41d4-a716-446655440000');
    console.log('  Generate 150 modules: node generate-large-dataset.js 550e8400-e29b-41d4-a716-446655440000 150');
    console.log('  Cleanup test data:    node generate-large-dataset.js 550e8400-e29b-41d4-a716-446655440000 --cleanup');
    process.exit(1);
  }
  
  const courseId = args[0];
  
  if (args[1] === '--cleanup') {
    await cleanupTestData(courseId);
  } else {
    const moduleCount = args[1] ? parseInt(args[1], 10) : 100;
    
    if (isNaN(moduleCount) || moduleCount < 1) {
      console.error('Error: moduleCount must be a positive integer');
      process.exit(1);
    }
    
    await generateLargeDataset(courseId, moduleCount);
  }
  
  await pool.end();
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  generateLargeDataset,
  cleanupTestData,
};
