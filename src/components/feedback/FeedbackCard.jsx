import React, { useState } from 'react';
import {
    Card,
    CardHeader,
    CardContent,
    CardActions,
    Avatar,
    Typography,
    Box,
    Chip,
    Button,
    IconButton,
    Collapse,
    Divider,
    TextField,
    Alert,
    Menu,
    MenuItem,
    Tooltip,
    ImageList,
    ImageListItem
} from '@mui/material';
import {
    ThumbUp,
    Favorite,
    Celebration,
    PanTool,
    Comment as CommentIcon,
    Visibility,
    MoreVert,
    Delete,
    Edit,
    Send
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { feedbackAPI } from '../../services/api';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'http://31.220.20.249:6001');

const FeedbackCard = ({ feedback, onReact, onComment, onDelete, onRefresh }) => {
    const { user, isHR } = useAuth();
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    // Increment view count when card is expanded
    const handleToggleComments = async () => {
        if (!showComments) {
            try {
                await feedbackAPI.incrementView(feedback._id);
            } catch (error) {
                console.error('Failed to increment view count');
            }
        }
        setShowComments(!showComments);
    };

    const handleReaction = (type) => {
        onReact(feedback._id, type);
    };

    const handleAddComment = () => {
        if (newComment.trim()) {
            onComment(feedback._id, newComment);
            setNewComment('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddComment();
        }
    };

    // Check if current user has reacted with a specific type
    const userReactedWith = (type) => {
        return feedback.reactions?.some(
            r => r.userId?._id === user?._id && r.type === type
        );
    };

    // Get reaction count by type
    const getReactionCount = (type) => {
        return feedback.reactions?.filter(r => r.type === type).length || 0;
    };

    // Get names of users who reacted with a specific type
    const getLikerNames = (type) => {
        const likers = feedback.reactions?.filter(r => r.type === type) || [];
        return likers.map(r => r.userId?.username || 'Unknown').join(', ');
    };

    // Status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': return 'primary';
            case 'Under Review': return 'warning';
            case 'Resolved': return 'success';
            case 'Closed': return 'default';
            default: return 'default';
        }
    };

    // Time ago helper
    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
        return new Date(date).toLocaleDateString();
    };

    const canEdit = feedback.submittedBy?._id === user?._id || isHR;

    return (
        <Card id={feedback._id} elevation={3}>
            {/* Header */}
            <CardHeader
                avatar={
                    <Avatar sx={{ bgcolor: '#1976d2' }}>
                        {feedback.submittedBy?.username?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                }
                title={
                    <Typography variant="h6" fontWeight="bold">
                        {feedback.subject}
                    </Typography>
                }
                subheader={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                            {feedback.submittedBy?.username || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            • {timeAgo(feedback.createdAt)}
                        </Typography>
                    </Box>
                }
                action={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                            label={feedback.category}
                            color="primary"
                            size="small"
                            variant="outlined"
                        />
                        <Chip
                            label={feedback.status}
                            color={getStatusColor(feedback.status)}
                            size="small"
                        />
                        {canEdit && (
                            <IconButton
                                size="small"
                                onClick={(e) => setAnchorEl(e.currentTarget)}
                            >
                                <MoreVert />
                            </IconButton>
                        )}
                    </Box>
                }
            />

            {/* Menu for Edit/Delete */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                <MenuItem onClick={() => {
                    onDelete(feedback._id);
                    setAnchorEl(null);
                }}>
                    <Delete sx={{ mr: 1 }} fontSize="small" />
                    Delete
                </MenuItem>
            </Menu>

            {/* Content */}
            <CardContent>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                    {feedback.message}
                </Typography>

                {/* Image Gallery */}
                {feedback.images && feedback.images.length > 0 && (
                    <ImageList
                        cols={feedback.images.length > 1 ? 2 : 1}
                        gap={8}
                        sx={{ mb: 2 }}
                    >
                        {feedback.images.map((image, index) => (
                            <ImageListItem key={index}>
                                <img
                                    src={`${BACKEND_URL}${image}`}
                                    alt={`Feedback attachment ${index + 1}`}
                                    loading="lazy"
                                    style={{ cursor: 'pointer', borderRadius: 8 }}
                                    onClick={() => setSelectedImage(`${BACKEND_URL}${image}`)}
                                />
                            </ImageListItem>
                        ))}
                    </ImageList>
                )}

                {/* Video Player */}
                {feedback.videos && feedback.videos.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        {feedback.videos.map((video, index) => (
                            <video
                                key={index}
                                controls
                                style={{ width: '100%', maxHeight: 400, borderRadius: 8, marginBottom: 8 }}
                            >
                                <source src={`${BACKEND_URL}${video}`} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        ))}
                    </Box>
                )}

                {/* Official HR Response */}
                {feedback.officialResponse && (
                    <Alert severity="info" icon={false} sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            📢 Official Response from HR
                        </Typography>
                        <Typography variant="body2">
                            {feedback.officialResponse.text}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            — {feedback.officialResponse.respondedBy?.username} • {timeAgo(feedback.officialResponse.respondedAt)}
                        </Typography>
                    </Alert>
                )}
            </CardContent>

            {/* Engagement Bar */}
            <CardActions sx={{ px: 2, pb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, flex: 1, flexWrap: 'wrap' }}>
                    {/* Reaction Buttons */}
                    <Tooltip title={getLikerNames('like') || 'Like'}>
                        <Button
                            size="small"
                            variant={userReactedWith('like') ? 'contained' : 'outlined'}
                            onClick={() => handleReaction('like')}
                            startIcon={<ThumbUp fontSize="small" />}
                        >
                            {getReactionCount('like')}
                        </Button>
                    </Tooltip>

                    <Tooltip title={getLikerNames('love') || 'Love'}>
                        <Button
                            size="small"
                            variant={userReactedWith('love') ? 'contained' : 'outlined'}
                            onClick={() => handleReaction('love')}
                            startIcon={<Favorite fontSize="small" />}
                            color="error"
                        >
                            {getReactionCount('love')}
                        </Button>
                    </Tooltip>

                    <Tooltip title={getLikerNames('celebrate') || 'Celebrate'}>
                        <Button
                            size="small"
                            variant={userReactedWith('celebrate') ? 'contained' : 'outlined'}
                            onClick={() => handleReaction('celebrate')}
                            startIcon={<Celebration fontSize="small" />}
                            color="warning"
                        >
                            {getReactionCount('celebrate')}
                        </Button>
                    </Tooltip>

                    <Tooltip title={getLikerNames('support') || 'Support'}>
                        <Button
                            size="small"
                            variant={userReactedWith('support') ? 'contained' : 'outlined'}
                            onClick={() => handleReaction('support')}
                            startIcon={<PanTool fontSize="small" />}
                            color="success"
                        >
                            {getReactionCount('support')}
                        </Button>
                    </Tooltip>

                    {/* Comment Button */}
                    <Button
                        size="small"
                        onClick={handleToggleComments}
                        startIcon={<CommentIcon fontSize="small" />}
                    >
                        {feedback.comments?.length || 0} Comments
                    </Button>

                    {/* View Count */}
                    {/* <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                        <Visibility fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                            {feedback.viewCount || 0} views
                        </Typography>
                    </Box> */}
                </Box>
            </CardActions>

            {/* Comments Section */}
            <Collapse in={showComments}>
                <Divider />
                <Box sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                    {/* Existing Comments */}
                    {feedback.comments && feedback.comments.length > 0 ? (
                        feedback.comments.map((comment) => (
                            <Box key={comment._id} sx={{ mb: 2, display: 'flex', gap: 1 }}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
                                    {comment.userId?.username?.charAt(0).toUpperCase() || 'U'}
                                </Avatar>
                                <Box sx={{ flex: 1, backgroundColor: 'white', p: 1.5, borderRadius: 2 }}>
                                    <Typography variant="subtitle2" fontWeight="bold">
                                        {comment.userId?.username || 'Unknown'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {comment.text}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                        {timeAgo(comment.createdAt)}
                                    </Typography>
                                </Box>
                            </Box>
                        ))
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                            No comments yet. Be the first to comment!
                        </Typography>
                    )}

                    {/* Add Comment Form */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </Avatar>
                        <TextField
                            fullWidth
                            multiline
                            maxRows={4}
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={handleKeyPress}
                            size="small"
                        />
                        <IconButton
                            color="primary"
                            onClick={handleAddComment}
                            disabled={!newComment.trim()}
                        >
                            <Send />
                        </IconButton>
                    </Box>
                </Box>
            </Collapse>
        </Card>
    );
};

export default FeedbackCard;
