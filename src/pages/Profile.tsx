import { useState } from "react";
import { Search, UserFollow, Music, Time } from "@carbon/icons-react";

const MOCK_FRIENDS_ACTIVITY = [
  {
    id: 1,
    user: { name: "Sarah J.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces" },
    song: "Blinding Lights",
    artist: "The Weeknd",
    time: "2 hours ago",
    context: "Noisy Bar",
  },
  {
    id: 2,
    user: { name: "Mike T.", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop&crop=faces" },
    song: "Inner City Blues",
    artist: "Kevin Saunderson",
    time: "5 hours ago",
    context: "Faint Audio",
  },
  {
    id: 3,
    user: { name: "Alex R.", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces" },
    song: "Strobe",
    artist: "deadmau5",
    time: "Yesterday",
    context: "Crowded Mall",
  },
];

export function Profile() {
  const [activeTab, setActiveTab] = useState<"friends" | "mine">("friends");

  return (
    <div className="flex flex-col min-h-full bg-[#161616] text-[#f4f4f4] font-sans">
      
      {/* Header */}
      <div className="px-4 py-6 border-b border-[#393939] flex items-center justify-between">
        <h1 className="text-2xl font-light tracking-tight">Social</h1>
        <button className="text-[#0f62fe] hover:underline flex items-center gap-2 text-sm">
          <UserFollow size={16} />
          Add Friend
        </button>
      </div>

      {/* Carbon Tabs */}
      <div className="flex border-b border-[#393939]">
        <button 
          onClick={() => setActiveTab("friends")}
          className={`flex-1 py-3 text-sm transition-colors border-b-2 ${activeTab === "friends" ? "border-[#0f62fe] text-[#f4f4f4] font-medium" : "border-transparent text-[#c6c6c6] hover:text-[#f4f4f4] hover:bg-[#262626]"}`}
        >
          Friend Activity
        </button>
        <button 
          onClick={() => setActiveTab("mine")}
          className={`flex-1 py-3 text-sm transition-colors border-b-2 ${activeTab === "mine" ? "border-[#0f62fe] text-[#f4f4f4] font-medium" : "border-transparent text-[#c6c6c6] hover:text-[#f4f4f4] hover:bg-[#262626]"}`}
        >
          My Discoveries
        </button>
      </div>

      {/* Feed (Carbon Data Table / List Style) */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "friends" ? (
          <div className="flex flex-col">
            {MOCK_FRIENDS_ACTIVITY.map((activity) => (
              <div key={activity.id} className="p-4 border-b border-[#393939] bg-[#161616] hover:bg-[#262626] transition-colors group">
                
                {/* User Row */}
                <div className="flex items-center gap-3 mb-3">
                  <img src={activity.user.avatar} alt={activity.user.name} className="size-8 object-cover border border-[#393939]" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#0f62fe]">{activity.user.name}</span>
                    <span className="text-xs text-[#8d8d8d] font-mono flex items-center gap-1">
                      <Time size={12} /> {activity.time}
                    </span>
                  </div>
                </div>
                
                {/* Track Row */}
                <div className="bg-[#262626] group-hover:bg-[#393939] p-4 border-l-2 border-[#0f62fe] transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Music size={16} className="text-[#8d8d8d]" />
                        <h4 className="text-base font-semibold text-[#f4f4f4]">{activity.song}</h4>
                      </div>
                      <p className="text-sm text-[#c6c6c6] ml-6">{activity.artist}</p>
                    </div>
                    
                    {/* Context Tag */}
                    <div className="bg-[#161616] border border-[#393939] px-2 py-1 text-[10px] uppercase font-mono text-[#c6c6c6] whitespace-nowrap">
                      {activity.context}
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <Search size={32} className="text-[#8d8d8d] mb-4" />
            <h3 className="text-base font-medium text-[#f4f4f4] mb-2">No discoveries yet</h3>
            <p className="text-sm text-[#c6c6c6]">Head to the Discover tab to find your first song.</p>
          </div>
        )}
      </div>

    </div>
  );
}
