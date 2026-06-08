
const EventDots = ({ events = [], max = 3 }) => {
  if (!events || events.length === 0) {
    return <div className="h-[5px]" />; // Garante a altura para alinhamento
  }

  const visibleEvents = events.slice(0, max);

  return (
    <div className="flex items-center justify-center gap-1 h-[5px]">
      {visibleEvents.map(event => (
        <div
          key={event.id}
          className="w-[5px] h-[5px] rounded-full"
          style={{ backgroundColor: event.color || '#22D3EE' }}
        />
      ))}
    </div>
  );
};

export default EventDots;