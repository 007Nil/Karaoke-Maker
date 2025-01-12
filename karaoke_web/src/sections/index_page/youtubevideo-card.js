'use client';
import PropTypes from 'prop-types';
import ArrowDownTrayIcon from '@heroicons/react/24/solid/ArrowDownTrayIcon';
import PlayCircleIcon from '@heroicons/react/24/solid/PlayCircleIcon';

import { Avatar, Box, Card, CardContent, Divider, Stack, SvgIcon, Typography, Button } from '@mui/material';
import axiosInstance from 'src/utils/axios';
import CircularWithValueLabel from 'src/components/CircularProgressWithLabel'
import { useState } from 'react';

export const YoutubeVideoCard = (props) => {
  const { searchData } = props;

  const [karaokeClick, setKaraokeClick] = useState(false);
  const [mp3Click, setMp3Click] = useState(false);
  const [timeValue, setTimeValue] = useState(2)

  const handleKaraokeBtn = videoLink => () => {
    setKaraokeClick(true);
    axiosInstance.get('/api/create-karaoke-video?video_url=' + videoLink)
      .then((response) => {
        
      })
      .catch((error) => {
        console.error('Error fetching posts:', error);
      });
  };
  const handleMP3Btn = videoLink => () => {
    setMp3Click(true);
    axiosInstance.get('/api/donwload-mp3?video_url=' + videoLink)
      .then((response) => {
        if (response.status == 200) {
          let donwloadPath = response.data["response_data"]["download_path"]
          let downloadDir = response.data["response_data"]["download_dir"]
          let audioFileName = response.data["response_data"]["file_name"]
          window.location.href = '/api/download?type=mp3&download_path=' + donwloadPath + '&file_name=' + audioFileName;
          axiosInstance.get('/api/delete-dir?download_dir=' + downloadDir)
        }
        setTimeValue(100);
        setMp3Click(false);
      })
      .catch((error) => {
        console.error('Error fetching posts:', error);
        setMp3Click(false);
      });
  }
  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%'
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            pb: 3
          }}
        >

          <Avatar
            sx={{ height: '200px', width: '200px' }}
            src={searchData.thumbnailDetails.url}
            variant="square"
          />
          {/* <YouTube videoId={searchData.videoId}/> */}
        </Box>
        <Typography
          align="center"
          gutterBottom
          variant="p"
        >
          {searchData.videoTitle}
        </Typography>
      </CardContent>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        spacing={21}
        sx={{ p: 2 }}
      >
        <Stack
          alignItems="center"
          direction="row"
          spacing={1}
        >
          <Button variant='outlined'>
            <SvgIcon
              color="action"
              fontSize="small"
            >
              <PlayCircleIcon />
            </SvgIcon>
            Stream
          </Button>
          <Button variant='outlined' onClick={handleKaraokeBtn(searchData.videoLink)}>
            <SvgIcon
              color="action"
              fontSize="small"
            >
              <ArrowDownTrayIcon />
            </SvgIcon>
            Karaoke
          </Button>
          <Button variant='outlined' onClick={handleMP3Btn(searchData.videoLink)}>
            <SvgIcon
              color="action"
              fontSize="small"
            >
              <ArrowDownTrayIcon />
            </SvgIcon>
            {/* <CircularWithValueLabel/> */}
            MP3
          </Button>
          {mp3Click ? <CircularWithValueLabel time={timeValue} /> : ""}
        </Stack>
      </Stack>
    </Card>
  );
};

YoutubeVideoCard.propTypes = {
  searchData: PropTypes.object.isRequired
};