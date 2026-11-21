<script setup>
import { computed } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

const props = defineProps({
  todos: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['select-date', 'click-event'])

const calendarEvents = computed(() => {
  return props.todos.map(todo => ({
    id: String(todo.id),
    title: todo.is_finished ? `✓ ${todo.title}` : todo.title,
    start: todo.date_from,
    end: todo.date_to,
    backgroundColor: todo.is_finished ? '#198754' : '#0d6efd',
    borderColor: todo.is_finished ? '#146c43' : '#0a58ca',
    textColor: '#ffffff',
    extendedProps: {
      rawTodo: todo
    }
  }))
})

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  displayEventTime: true,
  eventTimeFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  },
  initialView: 'dayGridMonth',
  locale: 'sk',
  firstDay: 1,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  buttonText: {
    today: 'Dnes',
    month: 'Mesiac',
    week: 'Týždeň',
    day: 'Deň'
  },
  events: calendarEvents.value,
  selectable: true,
  editable: false,
  select(info) {
    emit('select-date', {
      start: info.startStr,
      end: info.endStr,
      allDay: info.allDay
    })
  },
  eventClick(info) {
    emit('click-event', info.event.extendedProps.rawTodo)
  }
}))
</script>

<template>
  <div class="calendar-wrapper bg-white p-3 rounded shadow-sm border">
    <FullCalendar :options="calendarOptions" />
  </div>
</template>

<style>
.fc {
  font-size: 0.9rem;
}
.fc-toolbar-title {
  font-size: 1.25rem !important;
  font-weight: 600;
}
.fc-event {
  cursor: pointer;
  padding: 1px 3px;
}

@media (max-width: 768px) {
  .fc-header-toolbar {
    flex-direction: column;
    gap: 0.5rem;
  }
  .fc-toolbar-title {
    font-size: 1.05rem !important;
  }
  .fc-button {
    padding: 0.25rem 0.5rem !important;
    font-size: 0.8rem !important;
  }
}
</style>