import Box from '@mui/material/Box';
import Rating from '@mui/material/Rating';
import Typography from '@mui/material/Typography';

export default function MyRating({ value, onChange }) {
  return (
    <Box
      sx={{
        height: '100%',
        backgroundColor: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #444'
    }}
    >
      <Typography component="legend">Rating</Typography>
      <Rating
        name="rating"
        value={value}
        onChange={onChange}
      />
    </Box>
  );
}
