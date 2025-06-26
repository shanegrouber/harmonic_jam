import ListAltIcon from "@mui/icons-material/ListAlt";
import FavoriteIcon from "@mui/icons-material/Favorite";
import BlockIcon from "@mui/icons-material/Block";
import BusinessIcon from "@mui/icons-material/Business";
import { Collection } from "../types";

interface SidebarProps {
  collections: Collection[];
  selectedCollectionId?: string;
  setSelectedCollectionId: (id: string) => void;
}

const collectionIcon = (name: string) => {
  if (name.toLowerCase().includes("liked"))
    return <FavoriteIcon fontSize="small" className="mr-2" />;
  if (name.toLowerCase().includes("ignore"))
    return <BlockIcon fontSize="small" className="mr-2" />;
  if (name.toLowerCase().includes("list"))
    return <ListAltIcon fontSize="small" className="mr-2" />;
  return <BusinessIcon fontSize="small" className="mr-2" />;
};

const Sidebar = ({
  collections,
  selectedCollectionId,
  setSelectedCollectionId,
}: SidebarProps) => (
  <aside className="bg-white rounded-none shadow flex flex-col border-r border-gray-200">
    <div className="font-bold text-xl border-b p-6 text-left text-black">
      Harmonic Jam
    </div>
    <div className="flex-1 overflow-y-auto px-4 pt-4">
      <p className="font-bold border-b mb-2 pb-2 text-left text-black">
        Collections
      </p>
      <div className="flex flex-col gap-2 text-left">
        {collections?.map((collection) => (
          <div
            key={collection.id}
            className={`flex items-center py-1 pl-4 pr-4 rounded-full cursor-pointer transition font-medium
              ${
                selectedCollectionId === collection.id
                  ? "bg-gray-200 text-gray-900 font-bold"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            onClick={() => setSelectedCollectionId(collection.id)}
          >
            {collectionIcon(collection.collection_name)}
            {collection.collection_name}
          </div>
        ))}
      </div>
    </div>
  </aside>
);

export default Sidebar;
