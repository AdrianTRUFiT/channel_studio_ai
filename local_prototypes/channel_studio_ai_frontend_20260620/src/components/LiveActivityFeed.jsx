import { MOCK_ACTIVITY_FEED } from "../lib/activity/activityFeed";

export default function LiveActivityFeed() {
  return (
    <aside className="activity-feed">
      <div className="activity-head">
        <div>
          <p className="eyebrow">Live Activity</p>
          <h3>Kitchen Feed</h3>
        </div>
        <span className="activity-live">Mock Live</span>
      </div>

      <div className="activity-list">
        {MOCK_ACTIVITY_FEED.map((item) => (
          <article key={item.id} className={`activity-item activity-${item.status.toLowerCase()}`}>
            <div className="activity-dot" />
            <div className="activity-body">
              <div className="activity-meta">
                <span>{item.time}</span>
                <strong>{item.authority}</strong>
              </div>
              <h4>{item.event}</h4>
              <p>{item.asset}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="activity-note">
        Only business-state events appear here. Technical logs stay hidden unless requested.
      </div>
    </aside>
  );
}
