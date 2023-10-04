from typing import List

def twoSum(self, nums: List[int], target: int) -> List[int]:
    for i in range(len(self.nums)):
        for j in range(i + 1, len(self.nums)):
            if (self.nums[i] + self.nums[j]) == self.target:
                return [i, j]
    return