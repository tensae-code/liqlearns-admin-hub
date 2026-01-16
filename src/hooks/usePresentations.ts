import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { parsePPTX, ParsedPresentation, ParsedSlide } from '@/lib/pptxParser';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

interface SlideResource {
  id: string;
  type: 'video' | 'audio' | 'quiz' | 'flashcard';
  title: string;
  showAfterSlide: number;
  showBeforeSlide: number;
}

interface ModulePresentation {
  id: string;
  moduleId: string;
  courseId: string;
  fileName: string;
  filePath: string;
  totalSlides: number;
  slideData: ParsedSlide[];
  resources: SlideResource[];
  uploadedBy: string;
  createdAt: string;
}

export const usePresentations = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isParsing, setIsParsing] = useState(false);

  const uploadPresentation = async (
    file: File,
    courseId: string,
    moduleId: string,
    resources: SlideResource[] = []
  ): Promise<ModulePresentation | null> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to upload');
        return null;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        toast.error('Profile not found');
        return null;
      }

      // Parse the PPTX file first
      setIsParsing(true);
      setUploadProgress(10);
      
      let parsedData: ParsedPresentation;
      try {
        parsedData = await parsePPTX(file);
        setUploadProgress(40);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        toast.error('Failed to parse presentation');
        return null;
      } finally {
        setIsParsing(false);
      }

      // Upload file to storage
      const filePath = `${courseId}/${moduleId}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('presentations')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload file');
        return null;
      }

      setUploadProgress(70);

      // Save presentation metadata to database
      const { data: presentation, error: dbError } = await supabase
        .from('module_presentations')
        .insert({
          module_id: moduleId,
          course_id: courseId,
          file_name: file.name,
          file_path: filePath,
          total_slides: parsedData.totalSlides,
          slide_data: JSON.parse(JSON.stringify(parsedData.slides)) as Json,
          resources: JSON.parse(JSON.stringify(resources)) as Json,
          uploaded_by: profile.id,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        // Try to clean up uploaded file
        await supabase.storage.from('presentations').remove([filePath]);
        toast.error('Failed to save presentation data');
        return null;
      }

      setUploadProgress(100);
      toast.success('Presentation uploaded successfully!', {
        description: `${parsedData.totalSlides} slides processed`
      });

      return {
        id: presentation.id,
        moduleId: presentation.module_id,
        courseId: presentation.course_id,
        fileName: presentation.file_name,
        filePath: presentation.file_path,
        totalSlides: presentation.total_slides,
        slideData: parsedData.slides,
        resources: resources,
        uploadedBy: presentation.uploaded_by,
        createdAt: presentation.created_at,
      };
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('An error occurred during upload');
      return null;
    } finally {
      setIsUploading(false);
      setIsParsing(false);
    }
  };

  const getPresentation = async (presentationId: string): Promise<ModulePresentation | null> => {
    const { data, error } = await supabase
      .from('module_presentations')
      .select('*')
      .eq('id', presentationId)
      .single();

    if (error || !data) {
      console.error('Fetch error:', error);
      return null;
    }

    return {
      id: data.id,
      moduleId: data.module_id,
      courseId: data.course_id,
      fileName: data.file_name,
      filePath: data.file_path,
      totalSlides: data.total_slides,
      slideData: (data.slide_data as unknown as ParsedSlide[]) || [],
      resources: (data.resources as unknown as SlideResource[]) || [],
      uploadedBy: data.uploaded_by,
      createdAt: data.created_at,
    };
  };

  const getPresentationsForModule = async (moduleId: string): Promise<ModulePresentation[]> => {
    const { data, error } = await supabase
      .from('module_presentations')
      .select('*')
      .eq('module_id', moduleId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Fetch error:', error);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      moduleId: item.module_id,
      courseId: item.course_id,
      fileName: item.file_name,
      filePath: item.file_path,
      totalSlides: item.total_slides,
      slideData: (item.slide_data as unknown as ParsedSlide[]) || [],
      resources: (item.resources as unknown as SlideResource[]) || [],
      uploadedBy: item.uploaded_by,
      createdAt: item.created_at,
    }));
  };

  const deletePresentation = async (presentationId: string, filePath: string): Promise<boolean> => {
    try {
      // Delete from storage
      await supabase.storage.from('presentations').remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from('module_presentations')
        .delete()
        .eq('id', presentationId);

      if (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete presentation');
        return false;
      }

      toast.success('Presentation deleted');
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('An error occurred');
      return false;
    }
  };

  const updateResources = async (
    presentationId: string, 
    resources: SlideResource[]
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('module_presentations')
      .update({ resources: JSON.parse(JSON.stringify(resources)) as Json })
      .eq('id', presentationId);

    if (error) {
      console.error('Update error:', error);
      toast.error('Failed to update resources');
      return false;
    }

    toast.success('Resources updated');
    return true;
  };

  return {
    isUploading,
    uploadProgress,
    isParsing,
    uploadPresentation,
    getPresentation,
    getPresentationsForModule,
    deletePresentation,
    updateResources,
  };
};
