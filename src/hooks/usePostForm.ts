
import { useState, useEffect } from 'react';
import { useUserData } from '@/hooks/useUserData';
import { useProfileData } from '@/hooks/useProfileData';
import { useCreatePost } from '@/hooks/usePosts';
import { toast } from 'sonner';

interface PostFormData {
  title: string;
  content: string;
  category: string;
  images: File[];
  shareMode: 'public' | 'circle' | 'user';
  selectedCircle: string | null;
  selectedUser: string | null;
  searchTerm: string;
}

interface UsePostFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  circleId?: string;
  onPostCreated?: (newPost: any) => void;
}

export const usePostForm = ({ onSuccess, onCancel, circleId, onPostCreated }: UsePostFormProps) => {
  const userData = useUserData();
  const { addPostToProfile } = useProfileData();
  const createPost = useCreatePost();
  
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    content: '',
    category: '',
    images: [],
    shareMode: 'public',
    selectedCircle: circleId || null,
    selectedUser: null,
    searchTerm: '',
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (circleId) {
      setFormData(prev => ({
        ...prev,
        shareMode: 'circle',
        selectedCircle: circleId,
      }));
    }
  }, [circleId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newFiles],
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return {
        ...prev,
        images: newImages,
      };
    });
  };

  const handleUserSelect = (userId: string, userName: string) => {
    setFormData(prev => ({
      ...prev,
      selectedUser: userId,
      searchTerm: userName,
    }));
  };

  const clearUserSelection = () => {
    setFormData(prev => ({
      ...prev,
      selectedUser: null,
      searchTerm: '',
    }));
  };

  const handleShareModeChange = (mode: 'public' | 'circle' | 'user') => {
    setFormData(prev => ({
      ...prev,
      shareMode: mode,
    }));
  };

  const handleCircleChange = (circleId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCircle: circleId,
    }));
  };

  const handleTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: value,
    }));
  };

  const handleContentChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      content: value,
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      category: value,
    }));
  };

  const handleSearchChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      searchTerm: value,
    }));
  };

  const handleSubmit = async () => {
    const { title, content } = formData;
    
    if (!title.trim()) {
      toast.error('Please add a title to your post');
      return;
    }

    if (!content.trim()) {
      toast.error('Please add some content to your post');
      return;
    }

    setLoading(true);

    try {
      await createPost.mutateAsync({
        title: title.trim(),
        body: content.trim(),
        type: 'insight',
      });
      
      resetForm();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: '',
      images: [],
      shareMode: 'public',
      selectedCircle: null,
      selectedUser: null,
      searchTerm: '',
    });
    setIsExpanded(false);
  };

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleCancel = () => {
    setIsExpanded(false);
    if (onCancel) onCancel();
  };

  return {
    formData,
    userData,
    isExpanded,
    loading,
    handleImageUpload,
    removeImage,
    handleUserSelect,
    clearUserSelection,
    handleShareModeChange,
    handleCircleChange,
    handleTitleChange,
    handleContentChange,
    handleCategoryChange,
    handleSearchChange,
    handleSubmit,
    handleExpand,
    handleCancel,
  };
};
