import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';

export default function MyForm({ severity = 'info', label, value, onChange }) {
    return (
        <Box sx={{ height: '100%', backgroundColor: '#000', border: '1px solid #444' }}>
            <Alert severity={severity}>This is an {severity} alert</Alert>
            <TextField value={value} onChange={onChange} label={label} variant="filled" sx={{ margin: '10px' }}/>
        </Box>
    );
}
