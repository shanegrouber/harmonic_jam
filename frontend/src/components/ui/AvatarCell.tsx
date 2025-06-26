import { Avatar, Box, Typography } from "@mui/material";

interface AvatarCellProps {
  name: string;
  avatarUrl?: string;
  date?: string;
}

const AvatarCell = ({ name, avatarUrl, date }: AvatarCellProps) => (
  <Box display="flex" alignItems="center" gap={1.2}>
    <Avatar
      src={avatarUrl}
      alt={name}
      sx={{ width: 28, height: 28, fontSize: 14 }}
    >
      {name[0]}
    </Avatar>
    <Box>
      <Typography variant="body2" fontWeight={500} color="text.primary">
        {name}
      </Typography>
      {date && (
        <Typography variant="caption" color="text.secondary">
          {date}
        </Typography>
      )}
    </Box>
  </Box>
);

export default AvatarCell;
