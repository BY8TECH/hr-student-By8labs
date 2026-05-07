import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Grid,
    IconButton,
    Chip,
    ImageList,
    ImageListItem,
    Dialog
} from '@mui/material';
import { Edit, Delete, AccessTime, Person } from '@mui/icons-material';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://hrstudent-backend.onrender.com');

const AnnouncementCard = ({ announcement, isHR, onEdit, onDelete }) => {
    const [imageDialogOpen, setImageDialogOpen] = React.useState(false);
    const [selectedImage, setSelectedImage] = React.useState(null);

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleImageClick = (image) => {
        setSelectedImage(image);
        setImageDialogOpen(true);
    };

    return (
        <>
            <Card id={announcement._id} sx={{ mb: 3, boxShadow: 3 }}>
                <CardContent>
                    {/* Header with Title and Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h5" gutterBottom color="primary" fontWeight="bold">
                                {announcement.title}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                                <Chip
                                    icon={<Person />}
                                    label={`${announcement.createdBy?.firstName} ${announcement.createdBy?.lastName}`}
                                    size="small"
                                    variant="outlined"
                                />
                                <Chip
                                    icon={<AccessTime />}
                                    label={formatDate(announcement.createdAt)}
                                    size="small"
                                    variant="outlined"
                                />
                            </Box>
                        </Box>
                        {isHR && (
                            <Box>
                                <IconButton onClick={() => onEdit(announcement)} color="primary">
                                    <Edit />
                                </IconButton>
                                <IconButton onClick={() => onDelete(announcement)} color="error">
                                    <Delete />
                                </IconButton>
                            </Box>
                        )}
                    </Box>

                    {/* Message Content */}
                    {announcement.message && (
                        <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
                            {announcement.message}
                        </Typography>
                    )}

                    {/* Images */}
                    {announcement.images && announcement.images.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom color="text.secondary">
                                Images:
                            </Typography>
                            <ImageList sx={{ width: '100%', maxHeight: 300 }} cols={3} rowHeight={164}>
                                {announcement.images.map((image, index) => (
                                    <ImageListItem
                                        key={index}
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => handleImageClick(image)}
                                    >
                                        <img
                                            src={`${BACKEND_URL}/${image}`}
                                            alt={`Announcement image ${index + 1}`}
                                            loading="lazy"
                                            style={{ objectFit: 'cover', borderRadius: '4px' }}
                                        />
                                    </ImageListItem>
                                ))}
                            </ImageList>
                        </Box>
                    )}

                    {/* Videos */}
                    {announcement.videos && announcement.videos.length > 0 && (
                        <Box>
                            <Typography variant="subtitle2" gutterBottom color="text.secondary">
                                Videos:
                            </Typography>
                            <Grid container spacing={2}>
                                {announcement.videos.map((video, index) => (
                                    <Grid item xs={12} md={6} key={index}>
                                        <video
                                            controls
                                            style={{ width: '100%', maxHeight: '400px', borderRadius: '8px' }}
                                        >
                                            <source src={`${BACKEND_URL}/${video}`} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Image Dialog for Full View */}
            <Dialog
                open={imageDialogOpen}
                onClose={() => setImageDialogOpen(false)}
                maxWidth="lg"
            >
                {selectedImage && (
                    <img
                        src={`${BACKEND_URL}/${selectedImage}`}
                        alt="Full size"
                        style={{ width: '100%', height: 'auto' }}
                    />
                )}
            </Dialog>
        </>
    );
};

export default AnnouncementCard;
