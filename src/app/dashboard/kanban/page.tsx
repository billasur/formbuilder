'use client'

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  message, 
  Empty, 
  Spin,
  Dropdown,
  Menu
} from 'antd';
import { 
  AppstoreOutlined, 
  PlusOutlined, 
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useRouter } from 'next/navigation';
import { auth } from '../../../firebase/config';
import { getForms, updateForm, deleteForm } from '../../../firebase/formService';
import { FormModel } from '../../../types/form';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const { Title, Paragraph } = Typography;

// Form status columns for the Kanban board
const columns = {
  draft: {
    id: 'draft',
    title: 'Drafts',
    status: false, // isPublished: false
  },
  published: {
    id: 'published',
    title: 'Published',
    status: true, // isPublished: true
  },
};

export default function KanbanBoardPage() {
  const router = useRouter();
  const [forms, setForms] = useState<FormModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [boardData, setBoardData] = useState({
    draft: [] as FormModel[],
    published: [] as FormModel[],
  });

  useEffect(() => {
    const fetchForms = async () => {
      if (!auth.currentUser) {
        router.push('/auth/signin');
        return;
      }
      
      try {
        const userForms = await getForms(auth.currentUser.uid);
        setForms(userForms);
        
        // Organize forms into columns
        const draftForms = userForms.filter(form => !form.isPublished);
        const publishedForms = userForms.filter(form => form.isPublished);
        
        setBoardData({
          draft: draftForms,
          published: publishedForms,
        });
      } catch (error) {
        console.error('Error fetching forms:', error);
        message.error('Failed to load forms');
      } finally {
        setLoading(false);
      }
    };
    
    fetchForms();
  }, [router]);

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    
    // Dropped outside the list
    if (!destination) return;
    
    // If the form was dropped in a different column
    if (source.droppableId !== destination.droppableId) {
      const formId = draggableId;
      const newStatus = destination.droppableId === 'published';
      
      // Update form status in Firebase
      try {
        await updateForm(formId, { isPublished: newStatus });
        
        // Update local state
        const updatedForms = forms.map(form => 
          form.id === formId ? { ...form, isPublished: newStatus } : form
        );
        setForms(updatedForms);
        
        // Update board data
        const sourceColumn = [...boardData[source.droppableId]];
        const destinationColumn = [...boardData[destination.droppableId]];
        const [removedForm] = sourceColumn.splice(source.index, 1);
        destinationColumn.splice(destination.index, 0, { ...removedForm, isPublished: newStatus });
        
        setBoardData({
          ...boardData,
          [source.droppableId]: sourceColumn,
          [destination.droppableId]: destinationColumn,
        });
        
        message.success(`Form ${newStatus ? 'published' : 'unpublished'} successfully`);
      } catch (error) {
        console.error('Error updating form status:', error);
        message.error('Failed to update form status');
      }
    } else {
      // Reordering within the same column
      const column = [...boardData[source.droppableId]];
      const [removedForm] = column.splice(source.index, 1);
      column.splice(destination.index, 0, removedForm);
      
      setBoardData({
        ...boardData,
        [source.droppableId]: column,
      });
    }
  };

  const handleCreateForm = () => {
    router.push('/form/builder/new');
  };

  const handleEditForm = (formId) => {
    router.push(`/form/builder/${formId}`);
  };

  const handleViewResponses = (formId) => {
    router.push(`/dashboard/${formId}/results`);
  };

  const handleDeleteForm = async (formId) => {
    try {
      await deleteForm(formId);
      
      // Update local state
      const updatedForms = forms.filter(form => form.id !== formId);
      setForms(updatedForms);
      
      // Update board data
      const draftForms = boardData.draft.filter(form => form.id !== formId);
      const publishedForms = boardData.published.filter(form => form.id !== formId);
      
      setBoardData({
        draft: draftForms,
        published: publishedForms,
      });
      
      message.success('Form deleted successfully');
    } catch (error) {
      console.error('Error deleting form:', error);
      message.error('Failed to delete form');
    }
  };

  if (loading) {
    return <LoadingSpinner tip="Loading forms..." />;
  }

  return (
    <div className="dashboard-container">
      <Card className="kanban-container">
        <div className="kanban-header">
          <div>
            <Title level={2}>
              <AppstoreOutlined /> Form Kanban Board
            </Title>
            <Paragraph>
              Drag and drop forms between columns to change their status
            </Paragraph>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreateForm}
          >
            Create New Form
          </Button>
        </div>
        
        {forms.length === 0 ? (
          <Empty 
            description="No forms found. Create your first form to get started!" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="kanban-board">
              {Object.values(columns).map(column => (
                <div className="kanban-column" key={column.id}>
                  <div className="kanban-column-header">
                    <Title level={4}>{column.title}</Title>
                    <div className="kanban-column-count">
                      {boardData[column.id].length} forms
                    </div>
                  </div>
                  
                  <Droppable droppableId={column.id}>
                    {(provided) => (
                      <div
                        className="kanban-items"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {boardData[column.id].map((form, index) => (
                          <Draggable 
                            key={form.id} 
                            draggableId={form.id} 
                            index={index}
                          >
                            {(provided) => (
                              <div
                                className="kanban-item"
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <Card 
                                  size="small" 
                                  title={form.name}
                                  className="form-card"
                                  extra={
                                    <Dropdown
                                      overlay={
                                        <Menu>
                                          <Menu.Item 
                                            key="edit" 
                                            icon={<EditOutlined />}
                                            onClick={() => handleEditForm(form.id)}
                                          >
                                            Edit Form
                                          </Menu.Item>
                                          <Menu.Item 
                                            key="view" 
                                            icon={<EyeOutlined />}
                                            onClick={() => handleViewResponses(form.id)}
                                          >
                                            View Responses
                                          </Menu.Item>
                                          <Menu.Divider />
                                          <Menu.Item 
                                            key="delete" 
                                            icon={<DeleteOutlined />}
                                            danger
                                            onClick={() => handleDeleteForm(form.id)}
                                          >
                                            Delete Form
                                          </Menu.Item>
                                        </Menu>
                                      }
                                      trigger={['click']}
                                    >
                                      <Button 
                                        type="text" 
                                        icon={<MoreOutlined />} 
                                      />
                                    </Dropdown>
                                  }
                                >
                                  <Paragraph ellipsis={{ rows: 2 }}>
                                    {form.description || 'No description'}
                                  </Paragraph>
                                  <div className="form-meta">
                                    Fields: {form.fields?.length || 0} · 
                                    Updated: {form.updatedAt.toLocaleDateString()}
                                  </div>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        )}
      </Card>
    </div>
  );
} 