import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BarChartIcon from '@mui/icons-material/BarChart';
import AddIcon from '@mui/icons-material/Add';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TimelineIcon from '@mui/icons-material/Timeline';
import FolderIcon from '@mui/icons-material/Folder';
import ArchiveIcon from '@mui/icons-material/Archive';
import ListIcon from '@mui/icons-material/List';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import InboxIcon from '@mui/icons-material/Inbox';
import SettingsIcon from '@mui/icons-material/Settings';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DescriptionIcon from '@mui/icons-material/Description';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import RemoveIcon from '@mui/icons-material/Remove';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import BoltIcon from '@mui/icons-material/Bolt';

const Icon = ({ name, size = 20, className = '' }) => {
  const iconMap = {
    'kanban': DashboardIcon,
    'projects': CalendarMonthIcon,
    'chart': BarChartIcon,
    'plus': AddIcon,
    'empty': SentimentNeutralIcon,
    'calendar': CalendarTodayIcon,
    'timeline': TimelineIcon,
    'folder': FolderIcon,
    'archive': ArchiveIcon,
    'list': ListIcon,
    'trash': DeleteIcon,
    'restore': RestoreIcon,
    'inbox': InboxIcon,
    'settings': SettingsIcon,
    'grip-vertical': DragIndicatorIcon,
    'edit': EditIcon,
    'x': CloseIcon,
    'clock': AccessTimeIcon,
    'arrow-right': ArrowForwardIcon,
    'paperclip': AttachFileIcon,
    'download': DownloadIcon,
    'image': ImageIcon,
    'file': InsertDriveFileIcon,
    'file-text': DescriptionIcon,
    'video': VideoLibraryIcon,
    'music': MusicNoteIcon,
    'minus': RemoveIcon,
    'chevron-left': ChevronLeftIcon,
    'chevron-right': ChevronRightIcon,
    'users': PeopleIcon,
    'search': SearchIcon,
    'filter': FilterAltIcon,
    'user': PersonIcon,
    'star': StarIcon,
    'user-plus': PersonAddIcon,
    'alert-circle': ErrorOutlineIcon,
    'user-check': CheckCircleOutlineIcon,
    'user-x': PersonOffIcon,
    'check-circle': CheckCircleOutlineIcon,
    'zap': BoltIcon
  };

  const IconComponent = iconMap[name] || FolderIcon;

  return (
    <IconComponent
      className={className}
      sx={{
        fontSize: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    />
  );
};

export default Icon;
