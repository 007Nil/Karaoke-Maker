import MagnifyingGlassIcon from '@heroicons/react/24/solid/MagnifyingGlassIcon';
import { Card, InputAdornment, OutlinedInput, SvgIcon } from '@mui/material';
import axiosInstance from 'src/lib/axios';
import { useState } from 'react';

export const YoutubeSearch = (props) => {
  const [inputValue, setInputValue] = useState('');
  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };
  const handleAdornmentClick = () => {
    console.log('Input value:', inputValue);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      console.log('Enter key pressed. Input value:', inputValue);

      axiosInstance.get('http://localhost:8080/v1/api/youtube_search?query='+inputValue)
      .then((response) => {
        props.getSearchResultData(response.data.result);
      })
      .catch((error) => {
        console.error('Error fetching posts:', error);
      });
    }
  };

    return (
      <Card sx={{ p: 2 }}>
        <OutlinedInput
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          fullWidth
          placeholder="Search Videos on Youtube"
          startAdornment={(
            <InputAdornment
              position="start"

            >
              <SvgIcon
                color="action"
                fontSize="small"
                onClick={handleAdornmentClick}
              >
                <MagnifyingGlassIcon />
              </SvgIcon>
            </InputAdornment>
          )}
          sx={{ maxWidth: "full" }}
        />
      </Card>
    )
  };