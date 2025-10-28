import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Badge } from './ui/Badge';
import { Chip } from './ui/Chip';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Check, Clock, AlertCircle, Edit2, Trash2, Users, X, Calendar } from 'lucide-react';

// Vista de Tarjetas Pequeñas (Compacto)
export const SmallCardsView = ({ tasks, getStatusBadge, openEditModal, deleteTask }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {tasks.map(task => (
      <Card 
        key={task.id} 
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => openEditModal(task)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">{task.perspectiva}</Badge>
                {getStatusBadge(task.estatus)}
              </div>
              <CardTitle className="text-sm truncate">{task.actividad}</CardTitle>
            </div>
            <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" onClick={() => openEditModal(task)} className="h-7 w-7">
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)} className="h-7 w-7 text-red-500">
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {task.responsable && (
            <p className="text-xs text-gray-600 mb-2">👤 {task.responsable}</p>
          )}
          {task.subtareas && task.subtareas.length > 0 && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Subtareas</span>
              <span>{task.subtareas.filter(st => st.completada).length}/{task.subtareas.length}</span>
            </div>
          )}
        </CardContent>
      </Card>
    ))}
  </div>
);

// Vista de Lista
export const ListView = ({ tasks, getStatusBadge, openEditModal, deleteTask, updateTask }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Tarea</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Perspectiva</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Responsable</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Estado</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Progreso</th>
          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {tasks.map(task => {
          const progress = task.subtareas?.length > 0
            ? Math.round((task.subtareas.filter(st => st.completada).length / task.subtareas.length) * 100)
            : 0;
          
          return (
            <tr 
              key={task.id} 
              className="hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => openEditModal(task)}
            >
              <td className="px-4 py-3">
                <div className="font-medium text-sm text-gray-900">{task.actividad}</div>
                {task.descripcion && (
                  <div className="text-xs text-gray-500 truncate max-w-xs">{task.descripcion}</div>
                )}
              </td>
              <td className="px-4 py-3">
                <Badge variant="outline" className="text-xs">{task.perspectiva}</Badge>
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">{task.responsable || '-'}</td>
              <td className="px-4 py-3">{getStatusBadge(task.estatus)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">{progress}%</span>
                </div>
              </td>
              <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(task)} className="h-7 px-2">
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)} className="h-7 px-2 text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// Vista Kanban
export const KanbanView = ({ tasks, onDragEnd, getStatusBadge, openEditModal, deleteTask }) => {
  const priorities = {
    alta: { label: '🔴 Alta Prioridad', color: 'bg-red-50 border-red-300', icon: '🔴', tasks: [] },
    media: { label: '🟡 Media Prioridad', color: 'bg-yellow-50 border-yellow-300', icon: '🟡', tasks: [] },
    baja: { label: '🟢 Baja Prioridad', color: 'bg-green-50 border-green-300', icon: '🟢', tasks: [] }
  };

  tasks.forEach(task => {
    const priority = task.prioridad || 'media';
    if (priorities[priority]) {
      priorities[priority].tasks.push(task);
    }
  });

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(priorities).map(([priority, data]) => (
          <div key={priority} className={`rounded-xl border-2 ${data.color} p-4`}>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
              {data.label}
              <Badge variant="secondary">{data.tasks.length}</Badge>
            </h3>
            <Droppable droppableId={priority}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-3 min-h-[400px] rounded-lg p-2 drop-zone-active ${
                    snapshot.isDraggingOver 
                      ? 'bg-blue-100/80 border-2 border-dashed border-blue-400 scale-[1.02]' 
                      : 'border-2 border-transparent'
                  }`}
                  style={{
                    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'
                  }}
                >
                  {data.tasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`bg-white rounded-lg border-2 p-3 dragging-card ${
                            snapshot.isDragging 
                              ? 'shadow-2xl scale-110 border-blue-400 bg-blue-50 opacity-95' 
                              : 'border-gray-200 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md'
                          }`}
                          style={{
                            ...provided.draggableProps.style,
                            transition: snapshot.isDragging 
                              ? 'none' 
                              : 'transform 0.2s cubic-bezier(0.4, 0.0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)'
                          }}
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <div 
                              {...provided.dragHandleProps}
                              className="flex items-center justify-center w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 cursor-grab active:cursor-grabbing flex-shrink-0"
                              title="Arrastra para cambiar prioridad"
                            >
                              <span className="text-xs">⋮⋮</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <Badge variant="outline" className="text-xs mb-1">{task.perspectiva}</Badge>
                              <h4 
                                className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                                onClick={() => openEditModal(task)}
                              >
                                {task.actividad}
                              </h4>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEditModal(task)} className="h-6 w-6">
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)} className="h-6 w-6 text-red-500">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          {task.responsable && (
                            <p className="text-xs text-gray-600 mb-2">👤 {task.responsable}</p>
                          )}
                          <div className="flex items-center justify-between">
                            {getStatusBadge(task.estatus)}
                            {task.subtareas && task.subtareas.length > 0 && (
                              <span className="text-xs text-gray-500">
                                {task.subtareas.filter(st => st.completada).length}/{task.subtareas.length}
                              </span>
                            )}
                          </div>
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
  );
};

// Vista por Quarters
export const QuartersView = ({ tasks, projectData, getStatusBadge, openEditModal, deleteTask }) => {
  const quarters = {
    Q1: { months: ['AGOSTO', 'SEPTIEMBRE', 'OCTUBRE'], tasks: [] },
    Q2: { months: ['NOVIEMBRE', 'DICIEMBRE', 'ENERO'], tasks: [] },
    Q3: { months: ['FEBRERO', 'MARZO', 'ABRIL'], tasks: [] },
    Q4: { months: ['MAYO', 'JUNIO', 'JULIO'], tasks: [] }
  };

  // Agrupar tareas por quarter basado en fecha de inicio
  tasks.forEach(task => {
    if (task.fechaInicio) {
      const month = new Date(task.fechaInicio).getMonth();
      // Mapear mes a quarter (ajustar según tu calendario)
      if (month >= 7 && month <= 9) quarters.Q1.tasks.push(task);
      else if (month >= 10 || month === 0) quarters.Q2.tasks.push(task);
      else if (month >= 1 && month <= 3) quarters.Q3.tasks.push(task);
      else if (month >= 4 && month <= 6) quarters.Q4.tasks.push(task);
    } else {
      // Si no tiene fecha, agregarlo a Q1 por defecto
      quarters.Q1.tasks.push(task);
    }
  });

  return (
    <div className="space-y-6">
      {Object.entries(quarters).map(([quarter, data]) => (
        <div key={quarter} className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{quarter}</h3>
              <p className="text-sm text-gray-500">{data.months.join(' • ')}</p>
            </div>
            <Badge variant="secondary" className="text-sm">{data.tasks.length} tareas</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.tasks.map(task => (
              <Card 
                key={task.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openEditModal(task)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{task.perspectiva}</Badge>
                        {getStatusBadge(task.estatus)}
                      </div>
                      <CardTitle className="text-sm">{task.actividad}</CardTitle>
                    </div>
                    <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(task)} className="h-7 w-7">
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)} className="h-7 w-7 text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {task.responsable && (
                    <p className="text-xs text-gray-600 mb-2">👤 {task.responsable}</p>
                  )}
                  {task.fechaInicio && (
                    <p className="text-xs text-gray-500">📅 {task.fechaInicio}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {data.tasks.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay tareas en este quarter</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
