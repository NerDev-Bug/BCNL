function Events() {
  const events = [
    {
      id: 1,
      title: "Tech Meetup",
      date: "March 10, 2026",
      location: "San Francisco",
    },
    {
      id: 2,
      title: "Product Launch",
      date: "April 2, 2026",
      location: "Online",
    },
  ];

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Upcoming Events</h1>

      <div style={styles.list}>
        {events.map((event) => (
          <div key={event.id} style={styles.card}>
            <h2 style={styles.title}>{event.title}</h2>
            <p style={styles.text}>{event.date}</p>
            <p style={styles.text}>{event.location}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    maxWidth: "800px",
    margin: "0 auto",
  },
  heading: {
    marginBottom: "16px",
  },
  list: {
    display: "grid",
    gap: "16px",
  },
  card: {
    padding: "16px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    backgroundColor: "#fafafa",
  },
  title: {
    margin: "0 0 8px",
  },
  text: {
    margin: 0,
    color: "#555",
  },
};

export default Events;