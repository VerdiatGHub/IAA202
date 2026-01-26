/**
 * Content Item Service - REST API implementation
 * Handles content item CRUD operations within lessons
 */

import { api } from '../lib/api';
import type { ContentItem, CreateContentItemDto, UpdateContentItemDto } from '../types';

// Response types
interface ContentItemsApiResponse {
  contentItems: ContentItem[];
}

/**
 * Get all content items for a lesson
 */
export async function getContentItems(lessonId: string): Promise<ContentItem[]> {
  const { data, error } = await api.get<ContentItemsApiResponse>(
    `/lessons/${lessonId}/content`
  );

  if (error || !data) {
    throw new Error(error || 'Failed to fetch content items');
  }

  return data.contentItems;
}

/**
 * Get a single content item by ID
 */
export async function getContentItemById(contentId: string): Promise<ContentItem> {
  const { data, error } = await api.get<ContentItem>(`/content/${contentId}`);

  if (error || !data) {
    throw new Error(error || 'Failed to fetch content item');
  }

  return data;
}

/**
 * Create a new content item within a lesson
 */
export async function createContentItem(
  lessonId: string,
  contentData: CreateContentItemDto
): Promise<ContentItem> {
  // Validate content type-specific fields
  validateContentItemData(contentData);

  const { data, error } = await api.post<ContentItem>(
    `/lessons/${lessonId}/content`,
    contentData
  );

  if (error || !data) {
    throw new Error(error || 'Failed to create content item');
  }

  return data;
}

/**
 * Update an existing content item
 */
export async function updateContentItem(
  contentId: string,
  updates: UpdateContentItemDto
): Promise<ContentItem> {
  // Validate updates if they include type-specific fields
  if (updates.videoUrl !== undefined || updates.textContent !== undefined || 
      updates.resourceUrl !== undefined) {
    validateContentItemUpdates(updates);
  }

  const { data, error } = await api.put<ContentItem>(`/content/${contentId}`, updates);

  if (error || !data) {
    throw new Error(error || 'Failed to update content item');
  }

  return data;
}

/**
 * Delete a content item
 */
export async function deleteContentItem(contentId: string): Promise<void> {
  const { error } = await api.delete(`/content/${contentId}`);

  if (error) {
    throw new Error(error);
  }
}

/**
 * Reorder content items within a lesson
 */
export async function reorderContentItems(
  lessonId: string,
  contentItemIds: string[]
): Promise<ContentItem[]> {
  const { data, error } = await api.put<ContentItemsApiResponse>(
    `/lessons/${lessonId}/content/reorder`,
    { contentItemIds }
  );

  if (error || !data) {
    throw new Error(error || 'Failed to reorder content items');
  }

  return data.contentItems;
}

/**
 * Validate content item data based on content type
 */
function validateContentItemData(data: CreateContentItemDto): void {
  const { contentType, title, videoUrl, textContent, resourceUrl, resourceType } = data;

  // Validate title
  if (!title || title.trim() === '') {
    throw new Error('Title is required');
  }

  // Content type-specific validation
  switch (contentType) {
    case 'video':
      if (!videoUrl || videoUrl.trim() === '') {
        throw new Error('Video URL is required for video content');
      }
      validateUrl(videoUrl, 'Video URL');
      if (data.duration !== undefined && data.duration < 0) {
        throw new Error('Duration must be a positive number');
      }
      break;

    case 'text':
      if (!textContent || textContent.trim() === '') {
        throw new Error('Text content is required for text content type');
      }
      break;

    case 'quiz':
      // Quiz validation handled by quiz builder - no ID needed
      if (data.quizData && data.quizData.questions && data.quizData.questions.length === 0) {
        throw new Error('At least one question is required for quiz content');
      }
      break;

    case 'assignment':
      // Assignment validation - inline creation, no ID needed
      break;

    case 'resource':
      if (!resourceType) {
        throw new Error('Resource type is required for resource content');
      }
      if (resourceType === 'link') {
        if (!resourceUrl || resourceUrl.trim() === '') {
          throw new Error('Resource URL is required for link resources');
        }
        validateUrl(resourceUrl, 'Resource URL');
      } else if (resourceType === 'file') {
        if (!data.filePath || data.filePath.trim() === '') {
          throw new Error('File path is required for file resources');
        }
      }
      break;

    default:
      throw new Error(`Invalid content type: ${contentType}`);
  }
}

/**
 * Validate content item updates
 */
function validateContentItemUpdates(updates: UpdateContentItemDto): void {
  // Validate title if provided
  if (updates.title !== undefined && updates.title.trim() === '') {
    throw new Error('Title cannot be empty');
  }

  // Validate video URL if provided
  if (updates.videoUrl !== undefined && updates.videoUrl.trim() !== '') {
    validateUrl(updates.videoUrl, 'Video URL');
  }

  // Validate duration if provided
  if (updates.duration !== undefined && updates.duration < 0) {
    throw new Error('Duration must be a positive number');
  }

  // Validate text content if provided
  if (updates.textContent !== undefined && updates.textContent.trim() === '') {
    throw new Error('Text content cannot be empty');
  }

  // Validate resource URL if provided
  if (updates.resourceUrl !== undefined && updates.resourceUrl.trim() !== '') {
    validateUrl(updates.resourceUrl, 'Resource URL');
  }

  // Validate resource type consistency
  if (updates.resourceType === 'link' && updates.resourceUrl === undefined) {
    // This is okay - they might be updating other fields
  } else if (updates.resourceType === 'file' && updates.filePath === undefined) {
    // This is okay - they might be updating other fields
  }
}

/**
 * Validate URL format
 */
function validateUrl(url: string, fieldName: string): void {
  try {
    const urlObj = new URL(url);
    // Check for valid protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error(`${fieldName} must use HTTP or HTTPS protocol`);
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`${fieldName} is not a valid URL`);
    }
    throw error;
  }
}

// Export as service object
export const contentItemService = {
  getContentItems,
  getContentItemById,
  createContentItem,
  updateContentItem,
  deleteContentItem,
  reorderContentItems,
};

export default contentItemService;
